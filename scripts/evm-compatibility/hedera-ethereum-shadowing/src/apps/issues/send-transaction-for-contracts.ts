import { getRawTransaction } from "@/api/erigon/get-raw-transaction";
import { AccountId, Client, EthereumTransaction, Hbar, PrivateKey, TransactionId } from "@hashgraph/sdk";
import { sendHbarToAlias } from "../shadowing/transfers/send-hbar-to-alias";
import { getAccount } from "@/api/hedera-mirror-node/get-account";
import { getTransactionByHash } from "@/api/erigon/get-transaction-by-hash";

const txHashes = [
    "0x7afaa1366e0a6273b29a6d8d7c932e939dc681ef70dfdeed2fd1a66f582d000c",
    "0xca8b16fea090ff958938c0108ddf119d572692cb4c365bd2f157baefdc3c78cb",
    "0xd212c7375380654d8cff7bc1108108e9005373f6a63a837659b8c8bb2d7b0640",
    "0xc1923e125b41b7e61ce6c17fa2d675d079112c98f5c58f2757b005e1933c8e55",
    "0x70b559c2fa0f377cb82745851b05e561c1c16a6b4a56e050af036675747b79c4",
    "0x6104237ee16a4eef70a2c5b58872022793dfad1f08be0503cc2c4069c143c974",
    "0xc94d3530b9b968199789d517934acb7d6192dc96339bb0d74a9251a9f988d817",
    "0x95d4e120dbebb6228cc2f5386f43a25b519a72c9a50ff8c67239ef8ede22289f",
    "0x1b578438c2ff18e9e6526130571c880ab12c68731a257908f20c64933676f624",
    "0xdb26915ae633008664a77b42fde3d12ed65a10be1af5147e647f5c6cde667e06",
    "0xed8c28aabb063ffe486a64431005d015e488e66a80c983978e5a02000a86c782",
    "0x1e7dbef1d524d7fc09b2cffe011ef7b7196b9308e2c392c0bc97d8d3edc16cc6",
    "0x182509aaa95fec2b0b909006c1bd944f191490a6eb21c9e5cbf212a7350365c7",
    "0xc92c9aec4149dd3c3bdd647224f73fa7e44f32221e82f2e105d92708a8970a32",
    "0x7e0a2cba321084fba4b1abe2e46f74292ce6e55ed19e729697ed6df03c5e8e40",
    "0x2a9c28e630b6ef13e7cdd005e89a00ca850bf2a031594cb2437e6a5f3cf2f3c7",
    "0xd7ff41c60cc5abec799c0e33842742dedf5bf966c6066d31a318fc47326088b2",
    "0xf813718711fa5c2be7479a447d78ab60462f75da832aaa65a1c9bc0fb69da151",
    "0x25d1fa065f083c96bb5abf90eab8f6a82fea766c68765ac8724cba952325b3b2",
    "0x71df065c34e3e2da4886f2f6d997ac28bc3697ba2597353af66af4fb7c1eea27",
    "0x15242171a67b7cbc79e4e457c6e70bb5a2670a3b1f0f86617571aa4964d18da6",
    "0x914be9c8526a57504cc4d7a1688daa83a39c12da99e1ae299e4518222ccd1831",
    "0x625a84a1583e9171b19a8fe4582026b186914c1673e09b0e8dd331b389739f34",
    "0x99fee6a1c2ff4be27dbd0617ea94d46cf56f97eb22bddf798d3b89b76beb66cb",
    "0x452439a13caba9645cca2f6e6595b31131ae40133e69fca77d4977e7660327a0",
    "0x8454ef84f7d77ef215d3089c08044b50ec62ab4884f38a089aeb7dc57f4bdee4",
    "0xf0771bddf0a3175d584aa41a20258369cea73362c8a27b3af5c63a395dd31a86",
    "0x315797abced993f025717cb6d422f55927a9cefebcb1959b02b405c4b6bddf50",
    "0xa320b89377cf37349cd340ef52397ca1150a50f54f1a9d089a7ea3c9155039fa",
    "0x235da962f4eeba5a21b66c95f7078acf616856fc0666bb44b8e5a4534ad13b1f",
    "0xb7b56e8299eee1464294e258669fe6048a8530d8890d69cb3573cef3f89cfb32",
    "0x9b59ce95eb4d22cfb185bb5a79b2f8c8b1ade1e9c614c94e72d75c79e268ad88",
    "0x2ad7f74ad529728ca8df907822613e5e3114d3aab671ea2587249b27660d72f8",
    "0x5262c5bc5c941043ce088690d2ccdb18e88f73075d8c7c515c9d35488e0aa724",
    "0x20dc945c93a42f7b75f7e1b34816aa428894d9bd483d6beddaecd1fae7b39ccf",
    "0x7d23d0b7fc18400b082e6ef89925f1c1e3ee590c4cf9af3ce07d1a105676514e",
    "0x424cc3c0f3b90dfb84b1e2a5c0ee8e24dec8f24c6cb491ffbaa46e83958ba722",
    "0xfd103d868f1dba48c7d98087aee45b3d5d21744cc01647d90520bf87c8adb34b",
    "0xeda43cd67a8af36a87a1f3b29ad12dec8493dfc62747e03ee5b037b8eda181aa",
    "0xb3d441f1b4e939f4df79a8fc8e9cdca0fa6a16073a9ec005f48a600a5d6c25de",
    "0x1af706d8ddec53878afd281aa0f12a731f7425a3a6789932240750e2aaf296a4",
    "0xa3f9de7ef65c8e600700b45decb2eb03a19978f6acb7e87b484ce35fa6a2e037",
    "0x238293b25c1fb02fa283228f3492cb144fa81e623e9bd29102da25ea04b6012d",
    "0x18d06aab9266370664edf071a3f1308cebd7b75ae7075d1aad77d76370cbe114",
    "0x9e588bfd96efb86590963a0158b6dcf8a99101dfee2b97241a247e6ea4a25903",
    "0x46acc720e303f44d4aa26442766a8eec222178efa1db35cfee4b6a6bd32de08a",
    "0xf781ddd0a7714accc027e19da71842301260f86a065a503f3d8cac78f29d9ee7",
    "0xed6a60607c364de6feec836a804e50028e0dba75f4d71bd3bd16275b5ad46436",
    "0xf34c072832999d68ba21f1a0c853f39b9170c393f0c66410d4f9c7e84f218eae",
    "0xdaa9461c7b162a81af92d50ee76519a3300793abb01391a0f39afbb72719fc0c",
    "0x0f44d007764efbd7bd966b5f30706740abb50c991eb8ad1eca3c2eab46d8e182",
    "0x7c70d3e20d18c0c60ee4854bdbac8b558ded9d6138bd115838b8b97d2397d3e2",
    "0x1524cfd904ea3027ddaa03d051bac572e40d35459d9aefea5a5a08e74540f6e6",
    "0x458dfb142cc6c130c51dde97968e20cb7147f8e57623bd2804d4898b3504780c",
    "0x629de6248c8caf51aed658ad9530e7803cd82fe2ae2e33da42ae7cc95bbbc40c",
    "0x680dac3c6d55ddfc2a5d585bdd2588a9088b6f76d711731af2493b1a6cb63291",

    "0xdd5dc3aa57bbb587dd5d60f04435f41d5dd7dc088c38232722fe92d8a001b124",
    "0xa233824c52b22408d19fef90c3b74303481d8d7ac0d7ce25e460be947e80ae85",

    "0x4af5b7ec6ffdeb2b29ae7827b447f843f516624643499af145e0246193cc42f7",
    "0xb91191992c77469e47384aab227f974a63be8e71191c0e1cfff8098999b3a45e",
    "0x0865e286a561559a53eb1a67250b1015102f561bec7ecac2f9403a7ce801e71a",

    "0x282ae1f8a4981418fba13e73d037e8f089ed7a84cf2847fcbf1b79e54f72aee4",
    "0x41e57296dcd9412fb5230877b4f6ab2d2c7ce226828ec37cac4c060961a523bb",
    "0x31e0ac4e23b24a1f07dad5f41d2ed53b375852f9757894543129e1a483f3550e",
    "0x2e1a0f164a3b4b3fed8837a4adef4becd29a82ab5b6678e18b5f344db1cfdeeb",
    "0xe7e4df5da6b7a5836d251e59fbc7c9c109897a03082ff1889e06caf0858ca756",
    "0xf4e398bda81706ebb694d41c94fe22ed2a15579920eecc52fa6954e04b4e7180",
    "0x629ae5770ed10ce0e0fb47116c1a5ff99f740f57ad9f35a597136e448ccf7d3d",
    "0x1a9805f55c67d56313b5f467cd46374b1988b0e5323b9aaedcaaa3768efe8b3b",
    "0xc3b289a7912a248b299a598af7f2cac76ff9a3e4e5317ce05dbcc7e7ecf4d35c",
    "0xc8c0958e9f405b636252692966b132b3f7cb13a421f575b6530018e1f1c6a37e",
    "0x6c0c55124e4f7de40cf9d25236d9b333f10fb4b1a76fdbff33691355c7ed593b",
    "0x53191fd0a1990d2b3573698cb46639d583a935d446231df1ec12ce5fdaf05d25",
    "0x646245d26d01d57ca641aa00608cdb3516b2744abb25330aeb78787ee24f1ef1",
    "0xfb95ad2c12ca75b77f2cd9865292f2f08a0aa6ec19898b415fee1fec58e16597",
    "0x728bee0943bad36e792ff1424a6e7604b51996618962c59d91fbcf27567df3a8",
    "0x2865573bd0b58c945a7faca6828c329b2c34c299c277bd69719ed82f2427b053",
    "0x6d8459e62db274c1407454d5a9303c160efa7f36abd3fdac5e22bf3fe8f79789",
    "0xe2e6ef6cc1b5972c82c867aef8004e9f19fdfd51380ea3890e9916a132d84be6",
    "0xb28ccdb0e35d566c22ef549ab02c55131d14f8290fb03c8d117cbcea2b8c110a",
    "0x3481476483fbb31c27ae4686cef73e4311e2685fcddea12e0babac3f7e023617",
    "0x3ae56ed490d36898b23401a12b13bb7f8cdf9ba08119c1776cdeb8dd47a10047",
    "0x9be04751e0f6881ae3189db8634c59b04c39aa2758c97f45684652303c24e231",
    "0x1febca739c23352dde8d36c72e41b7eea699bcc377692ed6c15870d7d2ca0a0a",
    "0x109f280c9b48c3450ac3bbe6558a1ef312b65ad3024e59dcf3a11ad527d9a20e",
    "0xff151c7c98a97904c5a2f9b7314a0be3b8bbfbbdf74b8a90783f07813fef6baa",
    "0x7eb430054176ba1ba0c1adbae8b5b3ea4e204229be56e9529caa7c7f33efbe19",
    "0x2197439e6610e3cdd2bef6279a8170e6ebf8c2de98923b117cde66750268965c",
    "0xfbd8fe3d1bc69eca3005bf66b088a06f70010d33b4d984257373631ea0a8beaf",
    "0x9e6a6ff04d030d280044f3b5ef29bf6e8de40fe2ba373cd3666c7a4179a46f1b",
    "0xc43a11cc44ecc4fe4d59d1b5cbeda4cf0e2bacb2513063e0ddb142f703563c0a",
    "0x4f5c82952e3d29f2bb6cfe54099a0666f0ad252025c1b2a1896098272e56231f",

    "0x0a830a84787b3728db3aecf43671519d43829ba729971c9290ec792098908be1",
    "0x8de514f5aeddce235f74f8f79650c76e8d73cfe71e7fc47e6fa63b46f53eadfa",
    "0x89873d64365089dcb7ee5006f3193c4eecaf3bae3b7593b7be5912e307249b67",
    "0x43ffe995b1e30434bb9075112e1cb9f31ddbdf937e43a02b183cc1c81013d8c0",
    "0xec8e38efc485221dc4130716746d19f0614fc1996d888a32d7acb8d472f39467",
    "0xd45e02201a39e16a9ee0845de73049734672def95f038c23ab5b26c0459e2247",
    "0xd37c9bed810d49699925c0c850cf6edb47704b6822a4263243493937f0d6cbc4",
    "0x22fc1aec340ab750907ce628730fddefcc3d72b56032572eabd26823e870a79d",

    "0xcd5d828f223a6740e91486f0f8c374805812f2096e84db0cd890d615832b66a5",

    "0xd74ac788ee78bd2f0ca46cd9b313336d0055d3d947e418b2629b29bb15eb6319",
    "0xd6786789b853ee1b402026e33f45c7d850ecc82ba52774a2605bfba864a75953",
    "0x0a2662a1e1b29a09c8c0364790a5a84ba4cb3e64dec7ea939415930796b89dfd",
    
    "0xf158eccc365b2b0042d7fab8f379ee1d03290875cd7605e1c11d39f54a63fc52",
    "0x1d2b963194d69da11138fb74e2fd3fcb86cee13e4b3294aedfd93c3ebc6f2381",
    "0x2e812581dc63f5776849f69b9a835cbaef2f4654410999f6ebf5c2d7741daf0a",
    "0xa0fdbe06183b316595b46f97cd2f62bbd08752a86fe387164ab7c1a12091190e",
    "0x004ce05c70d4c5d83edac05d460f4ede90e1d7dadea13839493450e3bb57378f",
    "0xd298a2fab559842070d02190da4187d0792eda131f72fa74bd436bda9f860e2d",
    "0x3b1e267a3e0a33e6c5ef3221f48404849c520407d4f866053cd7e53d9d5c92ff",
    "0xcfe693558ec4b6a7033541bd8c825364080ce667423947005584b9e9efb4daaf",
    "0xe4c9d5efa152ff7f538ab5134ead3feee535df756d27e619ba6117e2d10799d7"
];

const txHashForTest = "0x5a5a1605f69dfca406e66abf0e6b3c86dd64546546461445ed41c1bfd665fd51";
const txSenderAddress = "0xeA1B261FB7Ec1C4F2BEeA2476f17017537b4B507";

export async function testForSmartContracts(
	accountId: AccountId,
	client: Client,
	nodeAccountId: AccountId,
    operatorPrivate: string) {
        await sendHbarToAlias(
            accountId,
            txSenderAddress,
            100000,
            client,
            0,
            nodeAccountId
        );
        for (const txHash of txHashes) {
            const tx = await getTransactionByHash(txHash);
            const isAccountCreated = await getAccount(tx.to);
            if (!isAccountCreated && tx && tx.to !== null) {
                console.log('account not found, created new account and sending 1 hbar... ' + tx.to)
                await sendHbarToAlias(
                    accountId,
                    tx.to,
                    1,
                    client,
                    0,
                    nodeAccountId
                );
            }
            console.log("sending transaction with hash ", txHash);
            const rawBody = await getRawTransaction(txHash);
            const txId = TransactionId.generate(accountId);
            const transaction = await new EthereumTransaction()
                .setTransactionId(txId)
                .setEthereumData(Uint8Array.from(Buffer.from(rawBody.substring(2), 'hex')))
                .setMaxGasAllowanceHbar(new Hbar(21000))
                .setNodeAccountIds([nodeAccountId])
                .freeze()
                .sign(PrivateKey.fromString(String(operatorPrivate)));
            const txResponse = await transaction.execute(client);
            console.log(txResponse.toJSON());
        }
        const rawBody = await getRawTransaction(txHashForTest);
        const txId = TransactionId.generate(accountId);
        const transaction = await new EthereumTransaction()
                .setTransactionId(txId)
                .setEthereumData(Uint8Array.from(Buffer.from(rawBody.substring(2), 'hex')))
                .setMaxGasAllowanceHbar(new Hbar(21000))
                .setNodeAccountIds([nodeAccountId])
                .freeze()
                .sign(PrivateKey.fromString(String(operatorPrivate)));
        const txResponse = await transaction.execute(client);
        console.log(txResponse.toJSON());
}