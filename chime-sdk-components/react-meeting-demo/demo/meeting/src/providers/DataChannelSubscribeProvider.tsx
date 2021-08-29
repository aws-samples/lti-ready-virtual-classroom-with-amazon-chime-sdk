import { ReactNode, useContext} from "react";
import React from "react";
import { DataChannelStateProvider } from "./DataChannelProvider";

type RealtimeDataAction = "sendmessage"
type RealtimeDataCmd = "TEXT" | "WHITEBOARD"

type Props = {
    children: ReactNode;
};

export type RealtimeData = {
    uuid: string
    action: RealtimeDataAction
    cmd: RealtimeDataCmd
    data: any
    createdDate: number
    senderName: string
}

export interface DataChannelSubscribeStateValue {
}

export const DataChannelSubscribeStateContext = React.createContext<DataChannelSubscribeStateValue | null>(null)


export const useDataChannelSubscribeState = (): DataChannelSubscribeStateValue => {
    const state = useContext(DataChannelSubscribeStateContext)
    if (!state) {
        throw new Error("Error using Data Channel Subscribe in context!")
    }
    return state
}

export const DataChannelSubscribeStateProvider = ({ children }: Props) => {
    const providerValue = {
    }
    return (
        <DataChannelSubscribeStateContext.Provider value={providerValue}>
            <DataChannelStateProvider>
                {children}
            </DataChannelStateProvider>
        </DataChannelSubscribeStateContext.Provider>
    )
}