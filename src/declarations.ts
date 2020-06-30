export interface PackageVersions {
    [key: string]: {
        name: string;
        version: string;
    };
}

export interface PackageInfo {
    modified: String;
    versions: PackageVersions[];
}

export interface RequiredPackageItem {
    name: string;
}
