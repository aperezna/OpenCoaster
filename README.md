# OpenCoaster 🎢

[![CI](https://github.com/aperezna/OpenCoaster/actions/workflows/ci.yml/badge.svg)](https://github.com/aperezna/OpenCoaster/actions/workflows/ci.yml)

Descubrí parques de diversiones y sus atracciones desde tu celular.

OpenCoaster es una app mobile hecha con **React Native + Expo** que te permite explorar parques temáticos, ver sus detalles, horarios, clima, y atracciones — todo desde un mapa interactivo.

## ✨ Funcionalidades

- **Mapa interactivo** — navegá por el mapa para descubrir parques cercanos con clustering de marcadores (Leaflet + OpenStreetMap)
- **Búsqueda con debounce** — buscá parques por nombre con filtro en tiempo real
- **Favoritos** — guardá tus parques favoritos y accedé desde el perfil
- **Detalle del parque** — horarios, clima actual, atracciones, y fotos
- **Pull-to-refresh** — actualizá datos deslizando hacia abajo
- **Loading skeletons** — esqueletos animados por card mientras carga
- **Dark mode** — modo oscuro automático que sigue al sistema
- **Offline-first** — caché persistente con AsyncStorage + TanStack Query (24h)
- **Onboarding** — carrusel de bienvenida en el primer inicio
- **Crash reporting** — Sentry captura errores en producción
- **Geolocalización** — obtené parques cercanos a tu ubicación

## 🛠 Stack

| Capa            | Tecnología                                        |
| --------------- | ------------------------------------------------- |
| Framework       | React Native 0.76 + Expo 52                       |
| Navegación      | React Navigation (bottom tabs + stack)            |
| Mapas           | Leaflet + WebView (OpenStreetMap)                 |
| Datos           | TanStack React Query v5                           |
| Caché offline   | @tanstack/query-async-storage-persister           |
| Favoritos       | AsyncStorage + StorageAdapter                     |
| Ubicación       | Expo Location                                     |
| Crash tracking  | Sentry (condicional por DSN env)                  |
| Tests unitarios | Jest + @testing-library/react-native              |
| E2E             | Maestro (YAML flows en `.maestro/flows/`)         |
| Tipado          | TypeScript 5.6                                    |
| Linter          | ESLint v10 (flat config)                          |
| Formatter       | Prettier                                          |
| Pre-commit      | Husky + lint-staged                               |
| CI/CD           | GitHub Actions (lint + format + test + typecheck) |

## 🚀 Arrancar

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Iniciar en desarrollo
npx expo start

# Iniciar en Android
npx expo start --android

# Iniciar en iOS
npx expo start --ios
```

### Configurar entorno

Copiá `.env.example` a `.env` y agregá el DSN de Sentry si querés crash reporting:

```bash
cp .env.example .env
# Editar .env con tu DSN de Sentry (opcional)
```

## 🧪 Tests

```bash
# Tests unitarios (127 tests, 23 suites)
npm test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:coverage

# TypeScript check
npm run typecheck

# Linter
npm run lint

# Formatter
npm run format
```

### Tests E2E (Maestro)

```bash
# Requiere: JDK 11+, Android emulator, Maestro CLI instalado
# Buildear APK e instalar en emulador, luego:
maestro test .maestro/flows/
```

## 🧱 Calidad

El proyecto aplica **Strict TDD**: los tests se escriben antes que la implementación. Pre-commit hooks ejecutan Prettier + ESLint sobre los archivos staged. CI corre en cada push/PR a `main`:

- ✅ `npm run format:check`
- ✅ `npm run lint`
- ✅ `npm test` (con `--forceExit`)
- ✅ `npm run typecheck`

## 📁 Estructura del proyecto

```
src/
├── config/             # Constantes y configuración global
├── data/
│   ├── cache/          # Adaptador de storage y React Query
│   ├── location/       # Servicio de geolocalización
│   ├── models/         # Tipos e interfaces del dominio
│   ├── providers/      # Fuentes de datos (ThemeParksWiki, ParkDiscovery)
│   └── storage/        # StorageAdapter + AsyncStorageAdapter
├── features/
│   ├── discovery/      # Mapa interactivo + búsqueda de parques
│   ├── onboarding/     # Carrusel de bienvenida
│   ├── park-details/   # Detalle del parque (horarios, clima, atracciones)
│   ├── parks-list/     # Lista de parques con búsqueda
│   └── profile/        # Perfil de usuario con favoritos
├── navigation/         # RootNavigator con tabs
├── components/         # Componentes compartidos (Skeleton, ErrorState)
└── theme/              # ThemeContext + colores (dark/light)
```

## 📄 Licencia

Uso privado — proyecto personal.
