export interface Device {
    id: number | string;
    name: string;
    model: string;
    type: 'printer' | 'scale' | 'scanner';
    connection: 'network' | 'usb' | 'bluetooth';
    address: string;
    status: 'online' | 'offline';
}

export interface HardwareState {
    scaleIpAddress: string;
    scannerComPort: string;
    defaultPrinter: string;
    scaleUnit: 'KG' | 'LBS';
}
