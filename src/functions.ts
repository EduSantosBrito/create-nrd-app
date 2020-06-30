import { RequiredPackageItem, PackageInfo } from './declarations';
import fetch from 'node-fetch';

const packages: RequiredPackageItem[] = [{ name: 'tiny-tarball' }];

async function getPackageVersions(packageName: string): Promise<PackageInfo> {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`, {
        headers: {
            Accept: 'application/vnd.npm.install-v1+json',
        },
    });

    const data: PackageInfo = await response.json();

    return data;
}

export { packages, getPackageVersions };
