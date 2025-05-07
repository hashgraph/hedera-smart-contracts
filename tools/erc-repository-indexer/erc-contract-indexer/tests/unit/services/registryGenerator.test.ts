import fs from 'fs';
import path from 'path';
import { RegistryGenerator } from '../../../src/services/registryGenerator';
import { ERCOutputInterface } from '../../../src/schemas/ERCRegistrySchemas';
import constants from '../../../src/utils/constants';

jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  promises: {
    mkdir: jest.fn(),
    writeFile: jest.fn(),
  },
}));

const mockedFs = fs as jest.Mocked<typeof fs>;

describe('RegistryGenerator', () => {
  let registry: RegistryGenerator;
  const mockERC20Path = constants.ERC_20_JSON_FILE_NAME;
  const mockContractA: ERCOutputInterface[] = [
    { contractId: '123', address: '0x123' },
  ];
  const mockContractB: ERCOutputInterface[] = [
    { contractId: '456', address: '0x456' },
  ];
  const mockNextPointerPath =
    constants.GET_CONTRACTS_LIST_NEXT_POINTER_JSON_FILE_NAME;

  beforeEach(() => {
    registry = new RegistryGenerator();

    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.readFileSync as jest.Mock).mockReturnValue(
      JSON.stringify(mockContractA)
    );
    (fs.promises.mkdir as jest.Mock).mockResolvedValue(undefined);
    (fs.promises.writeFile as jest.Mock).mockResolvedValue(undefined);
  });

  describe('generateErcRegistry', () => {
    it('should call updateRegistry for both ERC20 and ERC721 paths', async () => {
      const updateRegistrySpy = jest.spyOn<any, any>(
        registry,
        'updateRegistry'
      );

      await registry.generateErcRegistry(mockContractA, mockContractB);

      expect(updateRegistrySpy).toHaveBeenCalledTimes(2);
      expect(updateRegistrySpy).toHaveBeenCalledWith(
        registry['erc20JsonFilePath'],
        mockContractA
      );
      expect(updateRegistrySpy).toHaveBeenCalledWith(
        registry['erc721JsonFilePath'],
        mockContractB
      );
    });

    it('should not call updateRegistry if no contracts are provided', async () => {
      const updateRegistrySpy = jest.spyOn<any, any>(
        registry,
        'updateRegistry'
      );

      await registry.generateErcRegistry([], []);

      expect(updateRegistrySpy).not.toHaveBeenCalled();
    });
  });

  describe('readContentsFromFile', () => {
    it('should return an empty array if file does not exist', () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = registry['readContentsFromFile'](mockERC20Path);

      expect(result).toEqual('');
    });

    it('should parse JSON from file successfully', () => {
      const mockData = mockContractA;
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockData));

      const result = registry['readContentsFromFile'](mockERC20Path);

      expect(JSON.parse(result)).toEqual(mockData);
    });

    it('should throw error when file read fails', () => {
      mockedFs.readFileSync.mockImplementation(() => {
        throw new Error('Read error');
      });

      expect(() => registry['readContentsFromFile'](mockERC20Path)).toThrow(
        'Read error'
      );
    });
  });

  describe('writeContentsToFile', () => {
    it('should create directories and write contracts to file', async () => {
      const mockContracts: ERCOutputInterface[] = mockContractA;

      await registry['writeContentsToFile'](mockERC20Path, mockContracts);

      expect(mockedFs.promises.mkdir).toHaveBeenCalledWith(
        path.dirname(mockERC20Path),
        { recursive: true }
      );
      expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
        mockERC20Path,
        JSON.stringify(mockContracts, null, 2)
      );
    });

    it('should throw error when write fails', async () => {
      jest
        .spyOn(mockedFs.promises, 'writeFile')
        .mockRejectedValue(new Error('Write error'));

      await expect(
        registry['writeContentsToFile'](mockERC20Path, mockContractA)
      ).rejects.toThrow('Write error');
    });
  });

  describe('updateRegistry', () => {
    it('should remove duplicates and write unique contracts to file', async () => {
      const existingContracts: ERCOutputInterface[] = mockContractA;
      const newContracts: ERCOutputInterface[] = [
        mockContractA[0],
        mockContractB[0],
      ];

      mockedFs.readFileSync.mockReturnValue(JSON.stringify(existingContracts));

      await registry['updateRegistry'](mockERC20Path, newContracts);

      const expectedContracts = [mockContractA[0], mockContractB[0]];
      expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
        mockERC20Path,
        JSON.stringify(expectedContracts, null, 2)
      );
    });
  });

  describe('updateNextPointer', () => {
    it('should write the next pointer to the file if it is not null', async () => {
      await registry.updateNextPointer(mockNextPointerPath);

      expect(mockedFs.promises.writeFile).toHaveBeenCalledWith(
        registry['nextPointerFilePath'],
        JSON.stringify(mockNextPointerPath, null, 2)
      );
    });

    it('should not write to the file if the next pointer is null', async () => {
      await registry.updateNextPointer(null);

      expect(mockedFs.promises.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('retrieveNextPointer', () => {
    it('should return null if the file does not exist', async () => {
      mockedFs.existsSync.mockReturnValue(false);

      const result = await registry.retrieveNextPointer();

      expect(result).toBeNull();
    });

    it('should return the next pointer from the file', async () => {
      mockedFs.readFileSync.mockReturnValue(
        JSON.stringify(mockNextPointerPath)
      );

      const result = await registry.retrieveNextPointer();

      expect(result).toBe(mockNextPointerPath);
    });

    it('should return null if the file is empty', async () => {
      mockedFs.readFileSync.mockReturnValue('');

      const result = await registry.retrieveNextPointer();

      expect(result).toBeNull();
    });
  });
});
