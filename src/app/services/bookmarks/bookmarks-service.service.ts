import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomainMetadataModel } from 'src/app/models/domains';

@Injectable({
  providedIn: 'root',
})
export class BookmarksServiceService {
  constructor(protected snackBar: MatSnackBar) {}

  countBookmarks() {
    return this.loadBookmarksAndFeed().length;
  }

  loadBookmarks() {
    return localStorage.getItem('canvas-bookmarks');
  }

  loadBookmarksAndFeed() {
    const sBookmarks = this.loadBookmarks();
    if (sBookmarks !== null && sBookmarks !== '' && sBookmarks !== '[]') {
      return JSON.parse(sBookmarks);
    }
    return [];
  }

  saveAllBookmark(domainsData: DomainMetadataModel[]) {
    const bookmarksRaw = this.loadBookmarksAndFeed().reduce(
      (accumulator, value) => {
        return { ...accumulator, [value.labelName]: value };
      },
      {}
    );
    const bKeys = Object.keys(bookmarksRaw);
    let bookmarks = [...new Set(bKeys)].map((k) => bookmarksRaw[k]);
    bookmarks = bookmarks.concat(domainsData);
    localStorage.setItem('canvas-bookmarks', JSON.stringify(bookmarks));
    return bookmarks;
  }

  saveBookmark(domainData: DomainMetadataModel) {
    const bookmarksRaw = this.loadBookmarksAndFeed().reduce(
      (accumulator, value) => {
        return { ...accumulator, [value.labelName]: value };
      },
      {}
    );
    const bKeys = Object.keys(bookmarksRaw);
    const bookmarks = [...new Set(bKeys)].map((k) => bookmarksRaw[k]);
    bookmarks.push(domainData);
    localStorage.setItem('canvas-bookmarks', JSON.stringify(bookmarks));
    return bookmarks;
  }

  removeAllBookmarks() {
    localStorage.setItem('canvas-bookmarks', JSON.stringify([]));
    return [];
  }
  removeBookmark(bookmarks: DomainMetadataModel[], domainName: string) {
    const bookmarksUpdated = [];
    bookmarks.filter((d) => {
      if (d.labelName !== domainName) {
        bookmarksUpdated.push(d);
      }
    });
    localStorage.setItem('canvas-bookmarks', JSON.stringify(bookmarks));
    return bookmarks;
  }

  clearBookmarks() {
    localStorage.setItem('canvas-bookmarks', JSON.stringify([]));
  }

  isDomainBookmarked(bookmarks: DomainMetadataModel[], domainName: string) {
    for (const d of bookmarks) {
      if (d.labelName === domainName) {
        return true;
      }
    }
    return false;
  }
}
