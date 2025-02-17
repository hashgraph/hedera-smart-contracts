// SPDX-License-Identifier: Apache-2.0

/** @dev copy content to clipboard */
export const copyContentToClipboard = (content: string) => {
  navigator.clipboard.writeText(content);
};

/** @dev handle remove record */
export const handleRemoveMapRecord = (targetKey: any, setMap: any, transactionResultStorageKey: string) => {
  setMap((prev: any) => {
    prev.delete(targetKey);
    if (prev.size === 0) {
      localStorage.removeItem(transactionResultStorageKey);
    }
    return new Map(prev);
  });
};
