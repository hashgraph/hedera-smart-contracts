/*-
 *
 * Hedera Smart Contracts
 *
 * Copyright (C) 2023 Hedera Hashgraph, LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */

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
