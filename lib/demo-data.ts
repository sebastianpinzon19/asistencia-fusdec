import { DAY_COLS } from './sheets'

export const DEMO_HEADERS = [
  'ID',
  'NOMBRE',
  'DOCUMENTO',
  'UNIDAD',
  ...DAY_COLS,
]

export const DEMO_STUDENTS = [
  { _row: 2, _sheet: 'DEMO', ID: '1', NOMBRE: 'MARTINEZ LOPEZ, CARLOS ANDRES', DOCUMENTO: '1001234567', UNIDAD: 'ALPHA', 'DIA 1': '\u2713', 'DIA 2': '\u2713', 'DIA 3': '\u00d7', 'DIA 4': '' },
  { _row: 3, _sheet: 'DEMO', ID: '2', NOMBRE: 'RODRIGUEZ PEREZ, MARIA FERNANDA', DOCUMENTO: '1002345678', UNIDAD: 'ALPHA', 'DIA 1': '\u2713', 'DIA 2': '\u2713', 'DIA 3': '\u2713', 'DIA 4': '' },
  { _row: 4, _sheet: 'DEMO', ID: '3', NOMBRE: 'GONZALEZ CASTRO, JUAN PABLO', DOCUMENTO: '1003456789', UNIDAD: 'ALPHA', 'DIA 1': '\u2713', 'DIA 2': 'E', 'DIA 3': '\u2713', 'DIA 4': '' },
  { _row: 5, _sheet: 'DEMO', ID: '4', NOMBRE: 'HERNANDEZ RIOS, ANA LUCIA', DOCUMENTO: '1004567890', UNIDAD: 'BRAVO', 'DIA 1': '\u00d7', 'DIA 2': '\u2713', 'DIA 3': '\u2713', 'DIA 4': '' },
  { _row: 6, _sheet: 'DEMO', ID: '5', NOMBRE: 'SANCHEZ MORA, DIEGO ALEJANDRO', DOCUMENTO: '1005678901', UNIDAD: 'BRAVO', 'DIA 1': '\u2713', 'DIA 2': '\u2713', 'DIA 3': '\u2713', 'DIA 4': '' },
  { _row: 7, _sheet: 'DEMO', ID: '6', NOMBRE: 'TORRES VEGA, LAURA CAMILA', DOCUMENTO: '1006789012', UNIDAD: 'BRAVO', 'DIA 1': '\u2713', 'DIA 2': '\u00d7', 'DIA 3': 'E', 'DIA 4': '' },
  { _row: 8, _sheet: 'DEMO', ID: '7', NOMBRE: 'RAMIREZ SILVA, SEBASTIAN', DOCUMENTO: '1007890123', UNIDAD: 'CHARLIE', 'DIA 1': 'E', 'DIA 2': '\u2713', 'DIA 3': '\u2713', 'DIA 4': '' },
  { _row: 9, _sheet: 'DEMO', ID: '8', NOMBRE: 'CASTRO MENDEZ, VALENTINA', DOCUMENTO: '1008901234', UNIDAD: 'CHARLIE', 'DIA 1': '\u2713', 'DIA 2': '\u2713', 'DIA 3': '\u2713', 'DIA 4': '' },
  { _row: 10, _sheet: 'DEMO', ID: '9', NOMBRE: 'LOPEZ GARCIA, ANDRES FELIPE', DOCUMENTO: '1009012345', UNIDAD: 'CHARLIE', 'DIA 1': '\u2713', 'DIA 2': '\u2713', 'DIA 3': '\u00d7', 'DIA 4': '' },
  { _row: 11, _sheet: 'DEMO', ID: '10', NOMBRE: 'MORENO DIAZ, ISABELLA', DOCUMENTO: '1010123456', UNIDAD: 'DELTA', 'DIA 1': '\u2713', 'DIA 2': '\u2713', 'DIA 3': '\u2713', 'DIA 4': '' },
]
