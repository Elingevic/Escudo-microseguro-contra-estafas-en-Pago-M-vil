# Escudo

> Pagas tranquilo. Si te estafan, te respondemos.

Microseguro contra estafas digitales integrado en la app del banco, para usuarios de Pago Móvil en Venezuela: verificación del número antes de pagar, plan Familia para proteger a los padres, botón "Me estafaron" con reclamo guiado y una red de alertas compartida entre bancos. Postulación a **AseguraTech26**, desafío 2 (seguros inclusivos, microseguros y masivos).

## Carpetas

```
web/          prototipo (HTML, CSS y JS sin dependencias)
postulacion/  PDF único, lámina, video, guion y fuentes HTML
PITCH.md      pitch, guion de 5 minutos, preguntas del jurado y fuentes
vercel.json   le dice a Vercel que publique la carpeta web/
```

## Publicar en Vercel

Importa el repositorio en Vercel con *Framework Preset* = **Other** y sin comando de build. El `vercel.json` ya apunta a `web/`. Nombre sugerido del proyecto: **escudosegurosve**.

## Qué hace el prototipo

| Vista | Ruta | Qué muestra |
|---|---|---|
| Inicio | `#/` | Problema, solución y acceso a las vistas |
| Persona | `#/persona` | App en un teléfono: estado de protección, verificación antes de pagar, plan Familia con avisos, "Me estafaron" en 3 pasos y reclamos |
| Banco | `#/banco` | Clientes protegidos, pagos frenados, dinero evitado, comisión del canal e integración |
| Aseguradora | `#/aseguradora` | Personas protegidas, prima, siniestralidad, reclamos por modalidad, red de alertas y aprobación y pago de reclamos |
| Consultar número | `#/consultar?t=TELEFONO` | Consulta pública: denuncias verificadas de un número |

Números de prueba con denuncias: `0414-555-0198`, `0424-555-0731`, `0412-555-0466`. Todo corre en el navegador y el estado se guarda en `localStorage`. **Reiniciar demo** vuelve a los datos de ejemplo.

Personas, bancos, aseguradoras, números y montos son **ficticios o referenciales**.
