# Flota Clientes La Romana - CRM

Sistema CRM completo y responsivo para gestión de flota y clientes con interfaz minimalista.

## 🎨 Características

### Autenticación y Roles
- **Login seguro** con validación de credenciales
- **Dos roles de usuario**:
  - **Admin**: Acceso completo (crear, editar, eliminar)
  - **Usuario**: Solo lectura

### Credenciales de Prueba
- Admin: `admin / admin123`
- Usuario: `usuario / usuario123`

### Módulos Principales

#### 1. Dashboard
- Vista resumida de estadísticas (clientes, equipos, modelos)
- Filtros dinámicos por estado y tipo de equipo
- Tarjetas clicables con vista previa de clientes
- Navegación rápida a cada módulo

#### 2. Gestión de Clientes
- Listado con tarjetas responsivas
- Búsqueda en tiempo real
- Modal con vista de lectura y edición
- Validación de formularios
- Detección de duplicados por RIF/DNI
- Botón flotante "Registrar Cliente" (solo admin)
- Campos: Razón Social, RIF/DNI, Estado/Zona, Teléfono, Correo, Contacto, Dirección

#### 3. Gestión de Equipos
- Reporte agrupado por cliente y tipo de equipo
- Toggle para filtrar clientes con equipos
- Búsqueda global
- Modal con vista de lectura y edición
- **Funcionalidad NotInList**: Crear marcas/modelos sobre la marcha
- Validación de duplicados por serial+marca
- Campos con autocompletado (datalist)
- Campos: Cliente, Tipo, Marca, Modelo, Alias, Serial, Observación, Info Técnica

#### 4. Gestión de Modelos
- Listado agrupado por tipo y marca
- Búsqueda de modelos
- Modal con vista de lectura y edición
- Campos: nombre, marca, tipo, año, número de serie, info técnica, enlace ficha técnica
- Validación de URLs

### 🎯 Funcionalidades Especiales

- **Validaciones en tiempo real** en todos los formularios
- **Detección de duplicados** con alertas informativas
- **Modales dinámicos** con modos view/edit
- **Navegación responsiva** (desktop y móvil)
- **Transiciones suaves** y efectos hover
- **Permisos por rol** (botones admin ocultos para usuarios normales)
- **Autocompletado inteligente** con datalist
- **Creación dinámica** de marcas y modelos (NotInList)
- **Notificaciones toast** para feedback inmediato
- **Confirmaciones de eliminación** con diálogos de alerta
- **Persistencia de sesión** en localStorage
- **Cierre de sesión seguro**

## 🎨 Diseño

### Paleta de Colores
- **Azul Principal**: `#0066CC` - Elementos primarios, navegación
- **Azul Hover**: `#0052A3` - Estados hover de elementos azules
- **Naranja**: `#FF6B35` - Botones de acción, badges destacados
- **Naranja Hover**: `#E5582C` - Estados hover de elementos naranja
- **Verde**: Para indicadores positivos
- **Rojo**: Para acciones destructivas

### Estilo
- Diseño minimalista y limpio
- Tarjetas con sombras suaves
- Animaciones y transiciones fluidas
- Totalmente responsivo (mobile-first)
- Iconografía consistente con Lucide React
- Tipografía clara y legible

## 📱 Navegación

- `/` - Dashboard principal
- `/login` - Inicio de sesión
- `/clientes` - Lista de clientes
- `/equipos` - Reporte de equipos
- `/modelos` - Catálogo de modelos
- `*` - Página 404 para rutas no encontradas

## 🔐 Seguridad

- Rutas protegidas con redirección a login
- Sesión almacenada en localStorage
- Validación de permisos por rol
- Logout seguro con limpieza de sesión
- Redirección automática si ya está autenticado

## 🛠️ Tecnologías Utilizadas

- **React 18.3.1** con TypeScript
- **React Router 7** para navegación SPA
- **Tailwind CSS v4** para estilos
- **shadcn/ui** componentes de UI
- **Lucide React** para iconos
- **Sonner** para notificaciones toast
- **React Hook Form** para gestión de formularios
- **Vite** como bundler

## 📝 Datos Mock

El sistema incluye datos de prueba simulados:
- 5 clientes de ejemplo con diferentes ubicaciones
- 4 equipos registrados de diversos tipos
- 3 modelos predefinidos
- 5 marcas disponibles (Caterpillar, Komatsu, Volvo, Toyota, Hyundai)
- 4 tipos de equipos (Excavadora, Camión, Grúa, Montacargas)
- 5 estados (La Romana, Santo Domingo, Santiago, La Vega, San Pedro)
- Zonas dinámicas por estado

Los datos se almacenan en memoria y persisten durante la sesión.

## 🚀 Flujo de Uso

1. **Login**: Usuario ingresa con credenciales (admin o usuario)
2. **Dashboard**: Vista general con estadísticas y filtros
3. **Navegación**: Acceso a módulos desde header responsivo
4. **Búsqueda**: Filtrado en tiempo real por múltiples criterios
5. **Vista de Tarjetas**: Click en tarjeta abre modal de detalles
6. **Modo Lectura**: Visualización de información completa
7. **Modo Edición** (Admin): Click en "Editar Registro"
8. **Validaciones**: Feedback inmediato en formularios
9. **Guardado**: Confirmación con toast de éxito
10. **Eliminación** (Admin): Confirmación antes de eliminar
11. **NotInList**: Creación de marcas/modelos no existentes
12. **Logout**: Cierre seguro de sesión

## ✨ Características Destacadas

### Usuario Admin
- ✅ Crear nuevos registros (clientes, equipos, modelos)
- ✅ Editar registros existentes
- ✅ Eliminar registros con confirmación
- ✅ Acceso completo a todas las funciones
- ✅ Crear marcas/modelos dinámicamente

### Usuario Normal
- ✅ Visualizar todos los datos
- ✅ Buscar y filtrar información
- ✅ Ver detalles en modales
- ❌ No puede crear/editar/eliminar

### Sistema
- ✅ Sistema completo de CRUD
- ✅ Validaciones robustas en tiempo real
- ✅ Interfaz intuitiva y amigable
- ✅ Diseño 100% responsivo
- ✅ Manejo de roles y permisos
- ✅ Búsqueda y filtrado avanzado
- ✅ Notificaciones toast informativas
- ✅ Confirmaciones de acciones críticas
- ✅ Autoguardado de sesión
- ✅ Manejo de duplicados
- ✅ Autocompletado inteligente
- ✅ Agrupación dinámica de datos

## 📦 Estructura del Proyecto

```
src/
├── app/
│   ├── components/
│   │   ├── modals/
│   │   │   ├── ClienteModal.tsx
│   │   │   ├── EquipoModal.tsx
│   │   │   └── ModeloModal.tsx
│   │   ├── ui/
│   │   │   └── ... (shadcn components)
│   │   ├── EmptyState.tsx
│   │   └── Layout.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── data/
│   │   └── mockData.ts
│   ├── pages/
│   │   ├── Clientes.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Equipos.tsx
│   │   ├── Login.tsx
│   │   ├── Modelos.tsx
│   │   └── NotFound.tsx
│   ├── utils/
│   │   ├── constants.ts
│   │   └── helpers.ts
│   ├── App.tsx
│   └── routes.tsx
├── styles/
│   ├── fonts.css
│   ├── index.css
│   ├── tailwind.css
│   └── theme.css
└── imports/
    └── ... (imágenes referenciales)
```

## 🎯 Casos de Uso

### Registrar un Cliente
1. Click en "Registrar Cliente"
2. Llenar formulario con datos requeridos
3. Sistema valida RIF no duplicado
4. Click en "Guardar"
5. Toast de confirmación
6. Cliente aparece en listado

### Crear Equipo con Nueva Marca
1. Click en "Registrar Equipo"
2. Seleccionar cliente y tipo
3. Escribir nueva marca en campo autocompletado
4. Sistema detecta marca no existente
5. Confirmar creación de nueva marca
6. Continuar con registro de equipo

### Buscar y Editar Modelo
1. Ir a página de Modelos
2. Usar buscador para encontrar modelo
3. Click en tarjeta del modelo
4. Ver detalles en modo lectura
5. Click en "Editar Registro" (si es admin)
6. Modificar información
7. Guardar cambios

## 🔄 Próximas Mejoras Sugeridas

- [ ] Exportar datos a Excel/PDF
- [ ] Gráficos y estadísticas avanzadas
- [ ] Historial de cambios (audit log)
- [ ] Integración con API backend real
- [ ] Sistema de backup automático
- [ ] Filtros avanzados guardables
- [ ] Modo oscuro
- [ ] Notificaciones push
- [ ] Gestión de usuarios desde admin
- [ ] Reportes personalizados

## 📄 Licencia

Proyecto de demostración CRM - Flota Clientes La Romana