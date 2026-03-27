from .config import DAY_COLS

# Valores permitidos de asistencia - simplificados y consistentes
# "" = sin marcar, "✓" = presente, "×" = ausente, "E" = excusa
ATTENDANCE_VALUES = {"", "✓", "×", "E"}

DEMO_HEADERS = [
    "UNIDAD #",
    "NOMBRES Y APELLIDOS",
    "NO ID",
    "CELULAR",
    "SSE/VOL",
    "COLEGIO",
    "JORNADA",
    "CURSO",
] + DAY_COLS

DEMO_STUDENTS = [
    {**{"_row":2,"UNIDAD #":"1","NOMBRES Y APELLIDOS":"Ana Garcia Lopez","NO ID":"1098123456","CELULAR":"3001234567","SSE/VOL":"SSE","COLEGIO":"Colegio San Jose","JORNADA":"Manana","CURSO":"10A","DIA 1":"✓","DIA 2":"✓","DIA 3":"×"}, **{f"DIA {i}":"" for i in range(4,15)}},
    {**{"_row":3,"UNIDAD #":"2","NOMBRES Y APELLIDOS":"Carlos Mendoza Ruiz","NO ID":"1098234567","CELULAR":"3012345678","SSE/VOL":"VOL","COLEGIO":"Colegio San Jose","JORNADA":"Manana","CURSO":"10A","DIA 1":"✓","DIA 2":"E","DIA 3":"✓"}, **{f"DIA {i}":"" for i in range(4,15)}},
    {**{"_row":4,"UNIDAD #":"3","NOMBRES Y APELLIDOS":"Valentina Torres","NO ID":"1023456789","CELULAR":"3023456789","SSE/VOL":"SSE","COLEGIO":"Instituto Tecnico","JORNADA":"Tarde","CURSO":"11B","DIA 1":"×","DIA 2":"✓","DIA 3":"✓"}, **{f"DIA {i}":"" for i in range(4,15)}},
    {**{"_row":5,"UNIDAD #":"4","NOMBRES Y APELLIDOS":"Luis Eduardo Vargas","NO ID":"1034567890","CELULAR":"3034567890","SSE/VOL":"VOL","COLEGIO":"Instituto Tecnico","JORNADA":"Tarde","CURSO":"11B","DIA 1":"✓","DIA 2":"✓","DIA 3":"✓"}, **{f"DIA {i}":"" for i in range(4,15)}},
    {**{"_row":6,"UNIDAD #":"5","NOMBRES Y APELLIDOS":"Maria Camila Rios","NO ID":"1045678901","CELULAR":"3045678901","SSE/VOL":"SSE","COLEGIO":"Liceo Moderno","JORNADA":"Manana","CURSO":"9C","DIA 1":"E","DIA 2":"✓","DIA 3":"×"}, **{f"DIA {i}":"" for i in range(4,15)}},
    {**{"_row":7,"UNIDAD #":"6","NOMBRES Y APELLIDOS":"Sebastian Pinto Alvarez","NO ID":"1056789012","CELULAR":"3056789012","SSE/VOL":"VOL","COLEGIO":"Liceo Moderno","JORNADA":"Manana","CURSO":"9C","DIA 1":"✓","DIA 2":"✓","DIA 3":"E"}, **{f"DIA {i}":"" for i in range(4,15)}},
]
