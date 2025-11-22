# Mobile App

Aplicación móvil construida con Expo y React Native para reconocimiento facial.

## Instalación

Las dependencias se instalan automáticamente al ejecutar `npm install` desde la raíz del monorepo.

Si necesitas instalar manualmente:

```bash
npm install
```

## Desarrollo

### Iniciar el servidor de desarrollo

```bash
npm run dev
# o
npm start
```

### Ejecutar en plataformas específicas

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## Estructura

```
mobile/
├── App.tsx          # Componente principal
├── app.json         # Configuración de Expo
├── package.json     # Dependencias
└── tsconfig.json    # Configuración de TypeScript
```

## Tecnologías

- **Expo** - Framework para React Native
- **React Native** - Framework móvil
- **TypeScript** - Tipado estático
- **react-native-vision-camera** - Acceso a la cámara con alto rendimiento
- **react-native-vision-camera-face-detector** - Detección de rostros en tiempo real
- **react-native-reanimated** - Animaciones de alto rendimiento
- **react-native-worklets-core** - Procesamiento de frames en tiempo real

## Características

- ✅ Detección de rostros en tiempo real usando la cámara frontal
- ✅ Visualización de recuadro alrededor de la cara detectada
- ✅ Interfaz moderna y minimalista
- ✅ Manejo de permisos de cámara

## Configuración Importante

### Instalación de Dependencias

Después de instalar las dependencias, necesitas reconstruir la app nativa:

```bash
# Instalar dependencias
npm install

# Limpiar y reconstruir (iOS)
cd ios && pod install && cd ..

# O usar Expo prebuild
npx expo prebuild --clean
```

### Permisos

La app solicita automáticamente permisos de cámara. Los permisos están configurados en `app.json`:

- iOS: `NSCameraUsageDescription`
- Android: `CAMERA` permission

## Próximos Pasos

- Integrar con la API de reconocimiento facial del backend
- Implementar captura y envío de imágenes al servidor
- Mostrar resultados de matching con perfiles
