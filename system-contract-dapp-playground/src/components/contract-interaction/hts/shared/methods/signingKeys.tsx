// SPDX-License-Identifier: Apache-2.0

import { Dispatch, SetStateAction } from 'react';

/** @dev handle updating number of keys*/
export const handleAddingOrRemovingKeys = (
  type: 'ADD' | 'REMOVE',
  chosenKeys: Set<IHederaTokenServiceKeyType>,
  HederaTokenKeyTypes: IHederaTokenServiceKeyType[],
  setKeys: Dispatch<SetStateAction<ICommonKeyObject[]>>,
  setChosenKeys: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>,
  setKeyTypesToShow: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>,
  removingKeyType?: IHederaTokenServiceKeyType
) => {
  if (type === 'ADD') {
    HederaTokenKeyTypes.some((keyType) => {
      if (!chosenKeys.has(keyType)) {
        setKeys((prev) => [...prev, { keyType: keyType, keyValueType: 'inheritAccountKey', keyValue: '' }]);

        setChosenKeys((prev) => new Set(prev).add(keyType));

        setKeyTypesToShow((prev) => {
          prev.delete(keyType);
          return prev;
        });
        return true; // Exit the loop after the first condition is met
      }
    });
  } else {
    // removing case
    setKeys((prev) => prev.filter((deleteKey) => deleteKey.keyType !== removingKeyType));
    setChosenKeys((prev) => {
      prev.delete(removingKeyType!);
      return new Set(prev);
    });
    setKeyTypesToShow((prev) => new Set(prev).add(removingKeyType!));
  }
};

/** @dev handle key type on change by selecting an option from drop-down*/
export const handleKeyTypeOnChange = (
  e: any,
  currentKey: ICommonKeyObject,
  setKeys: Dispatch<SetStateAction<ICommonKeyObject[]>>,
  setChosenKeys: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>,
  setKeyTypesToShow: Dispatch<SetStateAction<Set<IHederaTokenServiceKeyType>>>
) => {
  let newKeyType = e.target.value;
  // @notice as the currentKey is based on `keys` array, must reserve the currentKey first
  let currentKeyType = currentKey.keyType;

  setKeys((prev) =>
    prev.map((key) => {
      if (key.keyType === currentKey.keyType) {
        key.keyType = newKeyType;
        key.keyValue = '';
      }
      return key;
    })
  );

  setChosenKeys((prev) => {
    prev.delete(currentKeyType);
    prev.add(newKeyType);
    return prev;
  });

  setKeyTypesToShow((prev) => {
    prev.delete(newKeyType);
    prev.add(currentKeyType);
    return prev;
  });
};

/** @dev handle key value type on change by selecting an option from drop-down */
export const handleKeyValueTypeOnChange = (
  e: any,
  currentKey: ICommonKeyObject,
  setKeys: Dispatch<SetStateAction<ICommonKeyObject[]>>
) => {
  setKeys((prev) =>
    prev.map((key) => {
      if (key.keyType === currentKey.keyType) {
        key.keyValueType = e.target.value;
        key.keyValue = '';
      }
      return key;
    })
  );
};

/** @dev handle updating key values */
export const handleUpdateKeyValue = (
  e: any,
  currentKey: ICommonKeyObject,
  setKeys: Dispatch<SetStateAction<ICommonKeyObject[]>>
) => {
  setKeys((prev) =>
    prev.map((key) => {
      if (key.keyType === currentKey.keyType) {
        key.keyValue =
          currentKey.keyValueType === 'inheritAccountKey'
            ? e.target.value === ''
              ? ''
              : JSON.parse(e.target.value)
            : e.target.value;
      }
      return key;
    })
  );
};
