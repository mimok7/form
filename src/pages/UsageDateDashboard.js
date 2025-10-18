'use client';

import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Ship,
  Plane,
  Building,
  MapPin,
  Car,
  Filter,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// 데이터 인터페이스
interface SHCReservation {
  orderId: string;
  customerName: string;
  customerEnglishName?: string;
  carType: string;
  carCode: string;
  carCount: number;
  passengerCount: number;
  pickupDatetime: string;
  pickupLocation: string;
  dropoffLocation: string;
  unitPrice: number;
  totalPrice: number;
  email: string;
}

interface SHRReservation {
  orderId: string;
  customerName: string;
  customerEnglishName?: string;
  cruise: string;
  category: string;
  roomType: string;
  roomCount: number;
  roomCode: string;
  days: number;
  discount: string;
  checkin: string;
  time: string;
  adult: number;
  child: number;
  toddler: number;
  boardingInfo: string;
  totalGuests: number;
  boardingHelp: string;
  discountCode: string;
  note: string;
  requestNote?: string;
}

interface SHCCReservation {
  orderId: string;
  customerName: string;
  customerEnglishName?: string;
  cruiseInfo?: string;
  boardingDate: string;
  serviceType: string;
  category: string;
  vehicleNumber: string;
  seatNumber: string;
  name: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  email: string;
}

interface SHPReservation {
  orderId: string;
  customerName: string;
  customerEnglishName?: string;
  tripType: string;
  category: string;
  route: string;
  carCode: string;
  carType: string;
  date: string;
  time: string;
  airportName: string;
  flightNumber: string;
  passengerCount: number;
  carrierCount: number;
  placeName: string;
  stopover: string;
  carCount: number;
  unitPrice: number;
  totalPrice: number;
  email: string;
}

interface SHHReservation {
  orderId: string;
  customerName: string;
  customerEnglishName?: string;
  hotelCode: string;
  hotelName: string;
  roomName: string;
  roomType: string;
  roomCount: number;
  days: number;
  checkinDate: string;
  checkoutDate: string;
  breakfastService: string;
  adult: number;
  child: number;
  toddler: number;
  extraBed: number;
  totalGuests: number;
  note: string;
  unitPrice: number;
  totalPrice: number;
  email: string;
}

interface SHTReservation {
  orderId: string;
  customerName: string;
  customerEnglishName?: string;
  tourCode: string;
  tourName: string;
  tourType: string;
  detailCategory: string;
  quantity: number;
  startDate: string;
  endDate: string;
  participants: number;
  dispatch: string;
  pickupLocation: string;
  dropoffLocation: string;
  memo: string;
  unitPrice: number;
  totalPrice: number;
  email: string;
  tourNote: string;
}

interface SHRCReservation {
  orderId: string;
  customerName: string;
  customerEnglishName?: string;
  carCode: string;
  tripType: string;
  category: string;
  route: string;
  carType: string;
  carCount: number;
  pickupDate: string;
  pickupTime: string;
  pickupLocation: string;
  carrierCount: number;
  destination: string;
  stopover: string;
  passengerCount: number;
  usagePeriod: string;
  memo: string;
  unitPrice: number;
  totalPrice: number;
  email: string;
}

export default function UsageDateDashboard() {
  const [googleSheetsData, setGoogleSheetsData] = useState([]);
  const [googleSheetsLoading, setGoogleSheetsLoading] = useState(true);
  const [googleSheetsError, setGoogleSheetsError] = useState(null);
  
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(today);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    loadGoogleSheetsData();
  }, [typeFilter]);

  const loadGoogleSheetsData = async () => {
    try {
      setGoogleSheetsLoading(true);
      setGoogleSheetsError(null);

      if (typeFilter === 'all') {
        const serviceTypes = ['cruise', 'car', 'vehicle', 'airport', 'hotel', 'tour', 'rentcar'];

        const results = await Promise.all(
          serviceTypes.map(async (type) => {
            try {
              const response = await fetch(`/api/schedule/google-sheets?type=${type}`);
              const contentType = response.headers.get('content-type');
              if (!contentType || !contentType.includes('application/json')) {
                return [];
              }
              const result = await response.json();
              return result.success ? (result.data || []) : [];
            } catch {
              return [];
            }
          })
        );

        const allData = results.flat();
        setGoogleSheetsData(allData);
      } else {
        const typeMapping = {
          'cruise': 'cruise',
          'car': 'car',
          'sht': 'vehicle',
          'airport': 'airport',
          'hotel': 'hotel',
          'tour': 'tour',
          'rentcar': 'rentcar'
        };

        const apiType = typeMapping[typeFilter] || 'car';
        const response = await fetch(`/api/schedule/google-sheets?type=${apiType}`);

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Google Sheets API가 올바르게 응답하지 않았습니다. (HTML 페이지 반환)');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || '데이터를 불러오는데 실패했습니다.');
        }

        setGoogleSheetsData(result.data || []);
      }
    } catch (err) {
      setGoogleSheetsError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setGoogleSheetsLoading(false);
    }
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;

    try {
      if (dateStr.includes('. ')) {
        const parts = dateStr.split('. ').map(p => p.trim());
        if (parts.length >= 3) {
          const [year, month, day] = parts;
          const dayNum = day.split(' ')[0];
          const date = new Date(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(dayNum)
          );
          return date;
        }
      }

      if (dateStr.includes('-')) {
        const datePart = dateStr.split(' ')[0];
        const [year, month, day] = datePart.split('-');
        const date = new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day)
        );
        return date;
      }

      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    } catch (error) {
      // 에러 무시
    }

    return null;
  };

  const isPastDate = (dateStr) => {
    const date = parseDate(dateStr);
    if (!date) return false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return date < today;
  };

  const isSameLocalDate = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const toKey = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const weekdayShort = ['일', '월', '화', '수', '목', '금', '토'];
  const formatDateLabel = (d) => {
    const dateStr = d.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' });
    return `${dateStr} (${weekdayShort[d.getDay()]})`;
  };

  const filteredGoogleSheets = googleSheetsData.filter(reservation => {
    let targetDate = null;

    if (reservation.checkin) {
      targetDate = parseDate(reservation.checkin);
    } else if (reservation.pickupDatetime) {
      targetDate = parseDate(reservation.pickupDatetime);
    } else if (reservation.boardingDate) {
      targetDate = parseDate(reservation.boardingDate);
    } else if (reservation.date) {
      targetDate = parseDate(reservation.date);
    } else if (reservation.checkinDate) {
      targetDate = parseDate(reservation.checkinDate);
    } else if (reservation.startDate) {
      targetDate = parseDate(reservation.startDate);
    } else if (reservation.pickupDate) {
      targetDate = parseDate(reservation.pickupDate);
    }

    if (!targetDate) {
      return false;
    }

    return isSameLocalDate(targetDate, selectedDate);
  });

  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // 타입 판별 함수들
  const isCruiseData = (item) => {
    return 'checkin' in item && 'cruise' in item;
  };

  const isVehicleData = (item) => {
    return 'boardingDate' in item && 'vehicleNumber' in item;
  };

  const isAirportData = (item) => {
    return 'airportName' in item && 'flightNumber' in item;
  };

  const isHotelData = (item) => {
    return 'hotelName' in item && 'checkinDate' in item;
  };

  const isTourData = (item) => {
    return 'tourName' in item && 'startDate' in item;
  };

  const isRentcarData = (item) => {
    return 'pickupDate' in item && 'usagePeriod' in item;
  };

  const isCarData = (item) => {
    return 'pickupDatetime' in item && !('boardingDate' in item) && !('pickupDate' in item);
  };

  const getServiceType = (reservation) => {
    if (isCruiseData(reservation)) return 'cruise';
    if (isVehicleData(reservation)) return 'vehicle';
    if (isAirportData(reservation)) return 'airport';
    if (isHotelData(reservation)) return 'hotel';
    if (isTourData(reservation)) return 'tour';
    if (isRentcarData(reservation)) return 'rentcar';
    if (isCarData(reservation)) return 'car';
    return 'unknown';
  };

  const getServiceInfo = (type) => {
    const serviceMap = {
      cruise: { icon: <Ship className="w-5 h-5" />, name: '크루즈', color: 'blue' },
      car: { icon: <Car className="w-5 h-5" />, name: '차량', color: 'blue' },
      vehicle: { icon: <Car className="w-5 h-5" />, name: '스하차량', color: 'purple' },
      airport: { icon: <Plane className="w-5 h-5" />, name: '공항', color: 'green' },
      hotel: { icon: <Building className="w-5 h-5" />, name: '호텔', color: 'orange' },
      tour: { icon: <MapPin className="w-5 h-5" />, name: '투어', color: 'red' },
      rentcar: { icon: <Car className="w-5 h-5" />, name: '렌트카', color: 'indigo' }
    };
    return serviceMap[type] || { icon: <Calendar className="w-5 h-5" />, name: '기타', color: 'gray' };
  };

  const groupedByService = filteredGoogleSheets.reduce((acc, reservation) => {
    const serviceType = getServiceType(reservation);
    (acc[serviceType] ||= []).push(reservation);
    return acc;
  }, {});

  // Google Sheets 예약 카드 렌더링 (원본 코드 유지)
  const renderGoogleSheetsCard = (reservation, index) => {
    if (isCruiseData(reservation)) {
      const checkinDate = parseDate(reservation.checkin);
      const isPast = isPastDate(reservation.checkin);

      return (
        <div
          key={`${reservation.orderId}-${index}`}
          className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col h-full ${isPast ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 border border-blue-200">
              <Ship className="w-5 h-5 text-blue-600" />
            </div>
            <h5 className="font-bold text-sm flex-1 truncate text-gray-800">크루즈</h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800'}`}>
              {isPast ? '완료' : '예정'}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {reservation.customerName && (
              <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100">
                <span className="font-bold text-blue-700 text-base">{reservation.customerName}</span>
                {reservation.customerEnglishName && (
                  <span className="text-xs text-gray-400">({reservation.customerEnglishName})</span>
                )}
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-500 text-xs mt-0.5">크루즈</span>
              <span className="text-sm font-bold text-blue-700 break-words">{reservation.cruise}</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-500 text-xs mt-0.5">객실</span>
              <span className="text-sm break-words">{reservation.roomType} {reservation.category && `(${reservation.category})`}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{checkinDate?.toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500 text-xs">인원</span>
              <span className="text-sm">
                {reservation.adult > 0 && `👨 ${reservation.adult}명`}
                {reservation.child > 0 && ` 👶 ${reservation.child}명`}
                {reservation.toddler > 0 && ` 🍼 ${reservation.toddler}명`}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-gray-500 text-xs">객실수</span>
              <span className="text-sm">{reservation.roomCount}개</span>
            </div>
          </div>
        </div>
      );
    }

    if (isVehicleData(reservation)) {
      const boardingDate = parseDate(reservation.boardingDate);
      const isPast = isPastDate(reservation.boardingDate);

      return (
        <div
          key={`${reservation.orderId}-${index}`}
          className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col h-full ${isPast ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-purple-50 border border-purple-200">
              <Car className="w-5 h-5 text-purple-600" />
            </div>
            <h5 className="font-bold text-sm flex-1 truncate text-gray-800">스하차량</h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-purple-100 text-purple-800'}`}>
              {isPast ? '완료' : '예정'}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {reservation.customerName && (
              <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100">
                <span className="font-bold text-purple-700 text-base">{reservation.customerName}</span>
                {reservation.customerEnglishName && (
                  <span className="text-xs text-gray-400">({reservation.customerEnglishName})</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{boardingDate?.toLocaleDateString('ko-KR')}</span>
            </div>
            <div className="flex items-start gap-2">
              <Car className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-sm break-words">{reservation.vehicleNumber} / 좌석: {reservation.seatNumber}</span>
            </div>
          </div>
        </div>
      );
    }

    if (isAirportData(reservation)) {
      const serviceDate = parseDate(reservation.date);
      const isPast = isPastDate(reservation.date);

      return (
        <div
          key={`${reservation.orderId}-${index}`}
          className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col h-full ${isPast ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-green-50 border border-green-200">
              <Plane className="w-5 h-5 text-green-600" />
            </div>
            <h5 className="font-bold text-sm flex-1 truncate text-gray-800">공항서비스</h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-green-100 text-green-800'}`}>
              {isPast ? '완료' : '예정'}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {reservation.customerName && (
              <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100">
                <span className="font-bold text-green-700 text-base">{reservation.customerName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">
                {serviceDate?.toLocaleDateString('ko-KR')} {reservation.time}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <Plane className="w-4 h-4 text-gray-400 mt-0.5" />
              <span className="text-sm break-words">{reservation.airportName} / {reservation.flightNumber}</span>
            </div>
          </div>
        </div>
      );
    }

    if (isHotelData(reservation)) {
      const checkinDate = parseDate(reservation.checkinDate);
      const isPast = isPastDate(reservation.checkinDate);

      return (
        <div
          key={`${reservation.orderId}-${index}`}
          className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col h-full ${isPast ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-orange-50 border border-orange-200">
              <Building className="w-5 h-5 text-orange-600" />
            </div>
            <h5 className="font-bold text-sm flex-1 truncate text-gray-800">호텔</h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-orange-100 text-orange-800'}`}>
              {isPast ? '완료' : '예정'}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {reservation.customerName && (
              <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100">
                <span className="font-bold text-orange-700 text-base">{reservation.customerName}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-500 text-xs mt-0.5">호텔</span>
              <span className="text-sm font-bold text-orange-700 break-words">{reservation.hotelName}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{checkinDate?.toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </div>
      );
    }

    if (isTourData(reservation)) {
      const startDate = parseDate(reservation.startDate);
      const isPast = isPastDate(reservation.startDate);

      return (
        <div
          key={`${reservation.orderId}-${index}`}
          className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col h-full ${isPast ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-pink-50 border border-pink-200">
              <MapPin className="w-5 h-5 text-pink-600" />
            </div>
            <h5 className="font-bold text-sm flex-1 truncate text-gray-800">투어</h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-pink-100 text-pink-800'}`}>
              {isPast ? '완료' : '예정'}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {reservation.customerName && (
              <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100">
                <span className="font-bold text-pink-700 text-base">{reservation.customerName}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-500 text-xs mt-0.5">투어</span>
              <span className="text-sm font-bold text-pink-700 break-words">{reservation.tourName}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">{startDate?.toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </div>
      );
    }

    if (isRentcarData(reservation)) {
      const pickupDate = parseDate(reservation.pickupDate);
      const isPast = isPastDate(reservation.pickupDate);

      return (
        <div
          key={`${reservation.orderId}-${index}`}
          className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col h-full ${isPast ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200">
              <Car className="w-5 h-5 text-indigo-600" />
            </div>
            <h5 className="font-bold text-sm flex-1 truncate text-gray-800">렌트카</h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-indigo-100 text-indigo-800'}`}>
              {isPast ? '완료' : '예정'}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {reservation.customerName && (
              <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100">
                <span className="font-bold text-indigo-700 text-base">{reservation.customerName}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-500 text-xs mt-0.5">차량</span>
              <span className="text-sm font-bold text-indigo-700 break-words">{reservation.carType}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">
                {pickupDate?.toLocaleDateString('ko-KR')} {reservation.pickupTime}
              </span>
            </div>
          </div>
        </div>
      );
    }

    if (isCarData(reservation)) {
      const pickupDate = parseDate(reservation.pickupDatetime);
      const isPast = isPastDate(reservation.pickupDatetime);

      return (
        <div
          key={`${reservation.orderId}-${index}`}
          className={`bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all p-3 flex flex-col h-full ${isPast ? 'opacity-60' : ''}`}
        >
          <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-100">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-50 border border-blue-200">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <h5 className="font-bold text-sm flex-1 truncate text-gray-800">차량</h5>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isPast ? 'bg-gray-200 text-gray-700' : 'bg-blue-100 text-blue-800'}`}>
              {isPast ? '완료' : '예정'}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-sm text-gray-700 mt-1">
            {reservation.customerName && (
              <div className="flex items-center gap-2 mb-1 pb-1 border-b border-gray-100">
                <span className="font-bold text-blue-700 text-base">{reservation.customerName}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="font-semibold text-gray-500 text-xs mt-0.5">차량</span>
              <span className="text-sm break-words">{reservation.carType}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm">{pickupDate?.toLocaleDateString('ko-KR')}</span>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  if (googleSheetsLoading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">사용일별 예약 조회</h1>

          {/* 날짜 컨트롤 */}
          <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigateDate('prev')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <h2 className="text-2xl font-semibold">
                {selectedDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </h2>

              <button
                onClick={() => setSelectedDate(new Date())}
                className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 text-sm font-medium hover:bg-blue-100"
              >
                오늘
              </button>

              <button
                onClick={() => navigateDate('next')}
                className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 타입 필터 */}
          <div className="flex gap-2 flex-wrap">
            <Filter className="w-5 h-5 text-gray-600 mt-2" />
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                typeFilter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              전체
            </button>
            {['cruise', 'car', 'vehicle', 'airport', 'hotel', 'tour', 'rentcar'].map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  typeFilter === type ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                {getServiceInfo(type).name}
              </button>
            ))}
          </div>
        </div>

        {/* 예약 목록 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          {googleSheetsError ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-red-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-red-600 mb-2">데이터 로드 실패</h3>
              <p className="text-sm text-gray-500">{googleSheetsError}</p>
            </div>
          ) : filteredGoogleSheets.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                {typeFilter === 'all' ? '예약된 일정이 없습니다' : `${getServiceInfo(typeFilter).name} 일정이 없습니다`}
              </h3>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByService)
                .sort(([typeA], [typeB]) => {
                  const order = ['cruise', 'car', 'vehicle', 'airport', 'hotel', 'tour', 'rentcar'];
                  return order.indexOf(typeA) - order.indexOf(typeB);
                })
                .map(([serviceType, reservations]) => {
                  const serviceInfo = getServiceInfo(serviceType);
                  const reservationArray = Array.isArray(reservations) ? reservations : [];
                  return (
                    <div key={serviceType}>
                      <div className="flex items-center gap-2 mb-3 pb-2 border-b-2">
                        <div className={`text-${serviceInfo.color}-600`}>
                          {serviceInfo.icon}
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {serviceInfo.name}
                          <span className="ml-2 text-sm text-gray-500">({reservationArray.length}건)</span>
                        </h3>
                      </div>

                      {serviceType === 'vehicle' ? (
                        <div className="space-y-4">
                          {Object.entries(
                            reservationArray.reduce((acc, reservation) => {
                              const category = reservation.category || '미분류';
                              (acc[category] ||= []).push(reservation);
                              return acc;
                            }, {})
                          ).map(([category, categoryReservations]) => (
                            <div key={category}>
                              <div className="flex items-center gap-2 mb-2 ml-4">
                                <span className="px-3 py-1 rounded bg-purple-100 text-purple-700 text-sm font-semibold">
                                  {category}
                                </span>
                                <span className="text-xs text-gray-500">({categoryReservations.length}건)</span>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {categoryReservations.map((reservation, index) =>
                                  renderGoogleSheetsCard(reservation, index)
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {reservationArray.map((reservation, index) =>
                            renderGoogleSheetsCard(reservation, index)
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
