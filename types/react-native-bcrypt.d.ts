declare module 'react-native-bcrypt' {
    export function hashSync(data: string, saltRounds: number): string;
    export function hash(data: string, saltRounds: number, callback: (err: Error | null, hash: string) => void): void;
    export function compareSync(data: string, encrypted: string): boolean;
    export function compare(data: string, encrypted: string, callback: (err: Error | null, result: boolean) => void): void;
} 