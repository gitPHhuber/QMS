import { makeAutoObservable } from "mobx"
import { userModel } from "src/types/UserModel"

export default class UserStore {
    private _isAuth: boolean = false
    private _user: userModel | null = null

    constructor() {
        makeAutoObservable(this)
    }

    setIsAuth(bool: boolean) {
        this._isAuth = bool
    }

    setUser(user: userModel) {
        this._user = user
    }

    resetUser() {
        this._user = null
        this._isAuth = false
    }


    can(permission: string): boolean {
        if (!this._user) return false;


        if (this._user.role === 'SUPER_ADMIN') return true;


        return this._user.abilities?.includes(permission) || false;
    }


    hasRole(role: string): boolean {
        return this._user?.role === role;
    }


    get user() {
        return this._user
    }

    get isAuth() {
        return this._isAuth
    }


    get isAdmin() {
        return this.can('admin.access') || this.can('rbac.manage');
    }
}
