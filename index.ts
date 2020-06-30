import { getPackageVersions, packages } from './src/functions';
import { RequiredPackageItem } from './src/declarations';

packages.forEach((packageItem: RequiredPackageItem) => {
    console.log(getPackageVersions(packageItem.name));
});
