import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { generalConfigurations } from 'src/app/configurations';
import { ENSDomainMetadataModel } from 'src/app/models/canvas';

@Injectable({
  providedIn: 'root',
})
export class RegistrationServiceService {
  constructor(protected snackBar: MatSnackBar) {}

  countRegistrations() {
    const rs = this.loadRegistrationsAndFeed();
    return rs.length;
  }

  loadRegistrations() {
    return localStorage.getItem('canvas-registrations');
  }

  loadRegistrationsAndFeed() {
    const sRegistrations = this.loadRegistrations();
    if (
      sRegistrations !== null &&
      sRegistrations !== 'null' &&
      sRegistrations !== '' &&
      sRegistrations !== '[]'
    ) {
      return JSON.parse(sRegistrations);
    }
    return [];
  }

  saveRegistrations(domainData: ENSDomainMetadataModel) {
    if (
      this.loadRegistrationsAndFeed().length >=
      generalConfigurations.maxDomainsToRegister
    ) {
      this.snackBar.open(
        'Only a maximum of ' +
          generalConfigurations.maxDomainsToRegister +
          ' domains can be registered.',
        'close',
        {
          horizontalPosition: 'center',
          verticalPosition: 'bottom',
          duration: 15000,
        }
      );
      return;
    }
    const registrationsRaw = this.loadRegistrationsAndFeed().reduce(
      (accumulator, value) => {
        return { ...accumulator, [value.labelName]: value };
      },
      {}
    );
    const bKeys = Object.keys(registrationsRaw);
    const registrations = [...new Set(bKeys)].map((k) => registrationsRaw[k]);
    registrations.push(domainData);
    localStorage.setItem('canvas-registrations', JSON.stringify(registrations));
    return registrations;
  }

  removeRegistration(
    registrations: ENSDomainMetadataModel[],
    domainName: string
  ) {
    const registrationsUpdated = [];
    registrations.filter((d) => {
      if (d.labelName !== domainName) {
        registrationsUpdated.push(d);
      }
    });
    localStorage.setItem(
      'canvas-registrations',
      JSON.stringify(registrationsUpdated)
    );
    return registrationsUpdated;
  }

  removeAllRegistrations() {
    return localStorage.setItem('canvas-registrations', '');
  }

  isDomainOnRegistrationList(
    registrations: ENSDomainMetadataModel[],
    domainName: string
  ) {
    for (const d of registrations) {
      if (d.labelName === domainName) {
        return true;
      }
    }
    return false;
  }
}
