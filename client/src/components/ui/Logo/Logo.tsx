// Stylized Title Logo component
// only takes font size component as a prop, default is 24px

import React from 'react';
import { Text } from '@mantine/core';
import './Logo.css';

interface LogoProps {
  fontSize?: number;
}

function Logo({ fontSize = 24 }: LogoProps) {
  return (
    <Text
      className="logo-text"
      style={{
        fontSize: `${fontSize}px`
    }}>
      ¡Doble Seis!
    </Text>);
}

export default Logo;