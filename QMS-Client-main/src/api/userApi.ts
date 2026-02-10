import { $authHost, $host } from "./index"
import { userModel } from "src/types/UserModel"

export const login = async (login: string, password: string) => {
    const { data } = await $host.post("api/users/login", { login, password })
    localStorage.setItem("token", data.token)
    return data
}

export const registration = async (login: string, password: string, name: string, surname: string) => {
    const { data } = await $host.post("api/users/registration", { login, password, name, surname })
    localStorage.setItem("token", data.token)
    return data
}

export const check = async () => {
    const { data } = await $authHost.get("api/users/auth")
    if (data && data.id) {
        localStorage.setItem("userID", String(data.id))
    }
    return data as userModel
}

export const fetchCurrentUser = async (id: number) => {
    const { data } = await $authHost.get(`api/users/${id}`)
    return data
}

export const updateUser = async (id: number, password: string, name: string, surname: string) => {
    const { data } = await $authHost.put("api/users", { id, password, name, surname })
    return data
}

export const updateUserImg = async (idAndImg: FormData) => {
    const { data } = await $authHost.patch("api/users", idAndImg)
    return data
}

export const deleteUser = async (id: number) => {
    const { data } = await $authHost.delete(`api/users/${id}`)
    return data
}

export const getUsers = async () => {
    const { data } = await $authHost.get("api/users")
    return data
}

export const fetchUsers = async () => {
    const { data } = await $authHost.get("api/users")
    return data
}

export const fetchSession = async () => {
    const { data } = await $authHost.get("api/sessions")
    return data
}

export const fetchPC = async () => {
    const { data } = await $authHost.get("api/pcs")
    return data
}

export const setSessionOnline = async (online: boolean, userId: number, pcId: number | null) => {
    const { data } = await $authHost.post("api/sessions", { online, userId, pcId })
    return data
}

export const createPC = async (ip: string, pc_name: string, cabinet: string) => {
    const { data } = await $authHost.post("api/pcs", { ip, pc_name, cabinet })
    return data
}

export const updatePC = async (id: number, ip: string, pc_name: string, cabinet: string) => {
    const { data } = await $authHost.put(`api/pcs/${id}`, { ip, pc_name, cabinet })
    return data
}

export const deletePC = async (id: number) => {
    const { data } = await $authHost.delete(`api/pcs/${id}`)
    return data
}