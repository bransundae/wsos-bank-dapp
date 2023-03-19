import {FC, useState} from "react";
import {useConnection, useWallet} from "@solana/wallet-adapter-react";
import { Program, AnchorProvider, web3, utils, BN } from '@project-serum/anchor';
import idl from "../../idl/solanapdas.json";
import {PublicKey} from "@solana/web3.js";

const idl_json = JSON.stringify(idl);
const idl_object = JSON.parse(idl_json);
const programID = new PublicKey(idl.metadata.address);

export const Bank: FC = () => {
    const wallet = useWallet();
    const { connection } = useConnection();

    const [banks, setBanks] = useState([]);

    const getProvider = () => {
        return new AnchorProvider(
            connection,
            wallet,
            AnchorProvider.defaultOptions()
        );
    };

    const createBank = async () => {
        try {
            const anchorProvider = getProvider();
            const program = new Program(idl_object, programID, anchorProvider);

            const [bank] = PublicKey.findProgramAddressSync([
                utils.bytes.utf8.encode('bankaccount'),
                anchorProvider.wallet.publicKey.toBytes()
            ], program.programId);

            await program.rpc.create('WsoS Bank', {
                accounts: {
                    bank,
                    user: anchorProvider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId
                }
            });

            console.log(`Wow, new bank was created: ${bank.toString()}`)
        } catch (error) {
            console.error(`Error while creating the bank ${error}`)
        }
    };

    const getBanks = async () => {
        const anchorProvider = getProvider();
        const program = new Program(idl_object, programID, anchorProvider);

        try {
            Promise.all(
                (await connection.getProgramAccounts(programID))
                    .map(async bank => ({
                        ...(await program.account.bank.fetch(bank.pubkey)),
                        pubkey: bank.pubkey
                    }))
            ).then(banks => {
                console.log(banks);
                setBanks(banks)
            });
        } catch(error) {
            console.error(`Error while getting the banks ${error}`)
        }
    };

    const depositBank = async (publicKey) => {
        const anchorProvider = getProvider();
        const program = new Program(idl_object, programID, anchorProvider);

        try {
            await program.rpc.deposit(
                new BN(0.1 * web3.LAMPORTS_PER_SOL),
                {
                    accounts: {
                        bank: publicKey,
                        user: anchorProvider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId
                    }
                }
            );

            console.log(`Deposit done: ${publicKey}`)
        } catch (error) {
            console.error(`Error while depositing: ${error}`)
        }
    };

    const withdrawBank = async (publicKey) => {
        const anchorProvider = getProvider();
        const program = new Program(idl_object, programID, anchorProvider);

        try {
            await program.rpc.withdraw(
                new BN(0.1 * web3.LAMPORTS_PER_SOL),
                {
                    accounts: {
                        bank: publicKey,
                        user: anchorProvider.wallet.publicKey,
                        systemProgram: web3.SystemProgram.programId
                    }
                }
            );

            console.log(`Withdraw done: ${publicKey}`)
        } catch (error) {
            console.error(`Error while withdrawing: ${error}`)
        }
    };

    return (
        <>
            {banks.map((bank, i) => {
                return(
                    <div className="md:hero-content flex flex-col" key={i}>
                        <h1>{bank.name.toString()}</h1>
                        <span>{bank.balance.toString()}</span>
                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => depositBank(bank.pubkey)}
                        >
                            <span className="block group-disabled:hidden">
                                Deposit 0.1
                            </span>

                        </button>

                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={() => withdrawBank(bank.pubkey)}
                        >
                            <span className="block group-disabled:hidden">
                                Withdraw 0.1
                            </span>

                        </button>
                    </div>
                )
            } )}
            <div className="flex flex-row justify-center">
                <>
                    <div className="relative group items-center">
                        <div className="m-1 absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500
                    rounded-lg blur opacity-20 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>

                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={createBank}
                        >
                            <span className="block group-disabled:hidden">
                                Create Bank
                            </span>

                        </button>

                        <button
                            className="group w-60 m-2 btn animate-pulse bg-gradient-to-br from-indigo-500 to-fuchsia-500 hover:from-white hover:to-purple-300 text-black"
                            onClick={getBanks}
                        >
                            <span className="block group-disabled:hidden">
                                Get Banks
                            </span>

                        </button>
                    </div>
                </>
            </div>
        </>
    );
}
