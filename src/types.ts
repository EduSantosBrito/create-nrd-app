export interface PackageVersion {
    [key: string]: {
        name: string;
        version: string;
    };
}

export interface PackageInfo {
    versions: PackageVersion[];
}

export interface PackageInfoParsed {
    versions: string[];
}

export interface RequiredPackageItem {
    name: string;
}
export interface RequiredPackages {
    dependencies: RequiredPackageItem[];
    devDependencies: RequiredPackageItem[];
}

export interface Spinner {
    interval: number;
    frames: string[];
}