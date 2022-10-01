import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomainMetadataModel } from 'src/app/models/domains';

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

  saveAllRegistrations(domainsData: DomainMetadataModel[]) {
    const registrationsRaw = this.loadRegistrationsAndFeed().reduce(
      (accumulator, value) => {
        return { ...accumulator, [value.labelName]: value };
      },
      {}
    );
    const bKeys = Object.keys(registrationsRaw);
    let registrations = [...new Set(bKeys)].map((k) => registrationsRaw[k]);
    registrations = registrations.concat(domainsData);
    localStorage.setItem('canvas-registrations', JSON.stringify(registrations));
    return registrations;
  }

  saveRegistrations(domainData: DomainMetadataModel) {
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

  removeRegistration(registrations: DomainMetadataModel[], domainName: string) {
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
    registrations: DomainMetadataModel[],
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
