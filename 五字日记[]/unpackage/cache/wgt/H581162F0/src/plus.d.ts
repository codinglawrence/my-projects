// 5+ App Runtime Type Declarations
// https://www.html5plus.org/doc/

interface PlusGeolocationPosition {
  coords: { latitude: number; longitude: number; };
  address?: { city?: string; district?: string; };
}

interface PlusGeolocation {
  getCurrentPosition(
    success: (pos: PlusGeolocationPosition) => void,
    error?: (err: any) => void,
    options?: { timeout?: number; geocode?: boolean; }
  ): void;
}

interface PlusSQLite {
  openDatabase(options: { name: string; path: string }): void;
  executeSql(options: { name: string; sql: string; values?: any[] }): void;
  selectSql(options: { name: string; sql: string; values?: any[] }): any[];
  closeDatabase(options: { name: string }): void;
}

declare const plus: {
  geolocation: PlusGeolocation;
  sqlite: PlusSQLite;
};
