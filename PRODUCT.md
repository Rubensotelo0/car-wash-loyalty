# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Clientes de Car Wash La Carpita que consultan y acumulan lavados desde su teléfono, y operadores que generan códigos y administran las tarjetas de los clientes durante el servicio.

## Product Purpose

Un programa de lealtad para el servicio de lavado de autos a domicilio. Cada vehículo acumula cinco lavados y recibe el sexto sin costo; el cliente puede consultar su tarjeta y el negocio puede registrar y canjear los sellos.

## Positioning

La tarjeta está vinculada al número de celular y a cada vehículo del cliente, y los sellos se registran mediante un código QR temporal generado por el operador.

## Operating Context

El cliente abre una tarjeta digital o la página de paquetes desde el celular. El operador usa un panel independiente para iniciar sesión, generar códigos QR de 90 segundos, localizar clientes, corregir sellos y confirmar canjes durante un servicio a domicilio.

## Capabilities and Constraints

Next.js 14 con Supabase. Las rutas existentes manejan autenticación de operador, códigos de un solo uso, tarjetas, vehículos, sellos y premios. La interfaz debe conservar sus contratos con la API y funcionar en pantallas móviles.

## Brand Commitments

Nombre: Car Wash La Carpita. Servicio a domicilio. La experiencia debe conservar un carácter limpio, confiable y vinculado al agua, sin cambiar el contenido comercial ni los datos de contacto existentes.

## Evidence on Hand

Implementación actual en `app/`, API en `app/api/` y fotografías de resultados y productos en `public/images/`. No se deben inventar testimonios, precios, resultados ni servicios adicionales.

## Product Principles

- La tarjeta y el avance por vehículo deben poder entenderse de un vistazo.
- Las acciones del operador deben ser claras, confirmables y seguras durante el servicio.
- Los códigos QR deben mantener alto contraste y lectura confiable.
- La información comercial debe facilitar una consulta o contacto inmediato desde el celular.
