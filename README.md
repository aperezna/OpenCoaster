# OpenCoaster 🎢

Descubrí parques de diversiones y sus atracciones desde tu celular.

OpenCoaster es una app mobile hecha con **React Native + Expo** que te permite explorar parques temáticos, ver sus detalles, horarios, clima, y atracciones — todo desde un mapa interactivo.

## ✨ Funcionalidades

- **Mapa interactivo** — navegá por el mapa para descubrir parques cercanos (usando Leaflet via WebView + OpenStreetMap)
- **Búsqueda de parques** — buscá por nombre o ubicación
- **Detalle del parque** — horarios, clima actual, atracciones, y fotos
- **Perfil de usuario** — configuración y preferencias
- **Geolocalización** — obtené parques cercanos a tu ubicación

## 🛠 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | React Native 0.76 + Expo 52 |
| Navegación | React Navigation (bottom tabs + stack) |
| Mapas | Leaflet + WebView (OpenStreetMap) |
| Cache | TanStack React Query |
| Ubicación | Expo Location |
| Tests | Jest + Testing Library |
| Tipado | TypeScript 5.6 |

## 🚀 Arrancar

```bash
# Instalar dependencias
npm install

# Iniciar en desarrollo
npx expo start

# Iniciar en Android
npx expo start --android

# Iniciar en iOS
npx expo start --ios

# Iniciar en web
npx expo start --web
```

## 🧪 Tests

```bash
# Ejecutar tests
npm test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:coverage

# TypeScript check
npm run typecheck
```

## 📁 Estructura del proyecto

```
src/
├── config/           # Constantes y configuración global
├── data/
│   ├── cache/        # Adaptador de storage y React Query
│   ├── location/     # Servicio de geolocalización
│   ├── models/       # Tipos e interfaces del dominio
│   └── providers/    # Fuentes de datos (ThemeParksWiki, ParkDiscovery)
├── features/         # Screens agrupadas por funcionalidad
│   ├── discovery/    # Mapa y búsqueda de parques
│   ├── park-details/ # Detalle del parque (horarios, clima, atracciones)
│   └── profile/      # Perfil de usuario
└── navigation/       # Navegación (RootNavigator con tabs)
```

## 📄 Licencia

Uso privado — proyecto personal.
