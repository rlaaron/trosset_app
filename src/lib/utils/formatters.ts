/**
 * @file: src/lib/utils/formatters.ts
 * @purpose: Funciones de formateo para fechas, moneda y números
 * @goal: Proporcionar formateo consistente en toda la aplicación
 * @context: Utilidades base - Formato MXN y fechas en español
 */

import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

/**
 * Formatea un número como moneda mexicana (MXN)
 * @param amount - Cantidad a formatear
 * @returns String formateado como $1,234.56
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
  }).format(amount);
}

/**
 * Formatea una fecha en formato legible en español
 * @param date - Fecha en formato ISO string o Date
 * @param formatStr - Formato deseado (default: 'dd MMM yyyy')
 * @returns String formateado como "25 Ene 2026"
 */
export function formatDate(date: string | Date, formatStr: string = 'dd MMM yyyy'): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: es });
}

/**
 * Formatea una fecha con día de la semana
 * @param date - Fecha en formato ISO string o Date
 * @returns String formateado como "Lun 25 Ene"
 */
export function formatDateWithDay(date: string | Date): string {
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, 'EEE dd MMM', { locale: es });
}

/**
 * Formatea un número con separadores de miles
 * @param num - Número a formatear
 * @param decimals - Cantidad de decimales (default: 0)
 * @returns String formateado como "1,234" o "1,234.56"
 */
export function formatNumber(num: number, decimals: number = 0): string {
  return new Intl.NumberFormat('es-MX', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Formatea un peso/cantidad con unidad
 * @param quantity - Cantidad
 * @param unit - Unidad (kg, g, ml, etc.)
 * @returns String formateado como "1,500 g" o "2.5 kg"
 */
export function formatQuantity(quantity: number, unit: string): string {
  const decimals = quantity < 10 ? 2 : 0;
  return `${formatNumber(quantity, decimals)} ${unit}`;
}

/**
 * Convierte segundos a formato MM:SS
 * @param seconds - Segundos totales
 * @returns String formateado como "03:45"
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Formatea un número de teléfono mexicano
 * @param phone - Número de teléfono
 * @returns String formateado como "555-123-4567"
 */
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

/**
 * Trunca un texto largo con ellipsis
 * @param text - Texto a truncar
 * @param maxLength - Longitud máxima
 * @returns String truncado
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
