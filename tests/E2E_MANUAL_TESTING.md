# E2E Manual Testing Guide

Los tests E2E están en `/tests/e2e-manual/` y se ejecutan manualmente para evitar conflictos con Jest + ESM (Prisma genera código con `require()` que rompe el loader ESM de Jest).

## Opción 1: Ejecutar servidor + tests en paralelo (Recomendado)

### Terminal 1: Inicia el servidor
```bash
npm run dev
```
El servidor estará disponible en `http://localhost:4000`

### Terminal 2: Ejecuta tests E2E contra el servidor en vivo
```bash
NODE_OPTIONS=--experimental-vm-modules npx jest tests/e2e-manual/ --runInBand
```

## Opción 2: Usar tests E2E con importación dinámica (Alternativa)

Si quieres que los tests E2E se ejecuten sin servidor externo, necesitas:
1. Convertir los tests para usar `request('http://localhost:4000')` en lugar de `request(app)`.
2. Asegurar que el servidor esté corriendo en otra terminal.

## Tests E2E disponibles

- **health.e2e.test.js**: Verifica endpoints de health (`/api/health`, `/api/payments/health`)
- **payments.e2e.test.js**: Verifica endpoints públicos de pagos (gateways, config, webhooks, stats)
- **payments.test.js**: Tests de sistema de pagos (autenticación, carrito, impuestos, órdenes)
- **security.test.js**: Tests de seguridad (rate limiting, headers, validación, CORS)

## Notas

- Los tests unitarios (`helpers.test.js`) se ejecutan con `npm test` sin dependencias externas.
- Los tests E2E requieren que el servidor esté corriendo o que se modifiquen para usar `request('http://localhost:PORT')`.
- Para CI/CD, considera usar `npm run dev &` en background y luego ejecutar E2E tests.
