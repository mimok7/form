import React from 'react';

export default function FormLabel({ htmlFor, col, icon }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'normal' }}>
      {icon ? icon : null}
      {col && col.label ? col.label : ''}
    </label>
  );
}
