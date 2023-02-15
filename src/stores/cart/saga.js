import { cartService } from "@/services/cart";
import { getToken, handleError, setCart } from "@/utils";
import { call, delay, put, race, select, take } from 'redux-saga/effects';
import { authActions } from "../auth";
import { cartActions, getCartAction, getInitialState } from ".";

export function* fetchCartItem(action) {
    try {
        yield delay(300)
        if (action.payload.quantity >= 1) {
            yield call(cartService.addItem, action.payload.productId, action.payload.quantity)

            // thunkApi.dispatch(getCartAction())
            yield put(getCartAction())

            if (action.payload.showPopover) {
                yield put(cartActions.togglePopover(true))

                window.scroll({
                    top: 0,
                    behavior: 'smooth'
                })
            }
        } else {
            yield put(removeCartItemAction(action.payload.productId))
        }

    } catch (err) {
        console.error(err)
    }
}


export function* fetchRemoveItem(action) {
    try {
        yield put(cartActions.toggleProductLoading({ productId: action.payload, loading: true }))
        yield call(cartService.removeItem, action.payload)
        yield put(getCartAction())
        yield put(cartActions.toggleProductLoading({ productId: action.payload, loading: false }))

    } catch (err) {
        console.error(err)
    }
}

export function* fetchCart() {
    if (getToken()) {
        // const cart = yield call(cartService.getCart)
        const { cart, logout } = yield race({
            cart: call(cartService.getCart),
            logout: take(authActions.logout)
        })

        if (cart) {
            yield put(cartActions.setCart(cart.data))
        }

        console.log({ cart, logout })
        // thunkApi.dispatch(cartActions.setCart(cart.data))
        // return cart
    }
}

export function* clearCart() {
    yield put(cartActions.setCart(null))
    // getInitialState()
}

export function* setCartSaga(action) {
    setCart(action.payload)
}

export function* fetchSelectCartItem(action) {

    try {
        let { cart: { preCheckoutData: { listItems } } } = yield select()
        // const { preCheckoutData } = cart
        // const { listItems } = preCheckoutData
        listItems = [...listItems]

        const {
            productId,
            checked
        } = action.payload

        if (checked) {
            listItems.push(productId)
        } else {
            listItems = listItems.filter(e => e !== productId)
        }

        yield put(cartActions.setPreCheckoutData({
            listItems
        }))

    } catch (err) {
        handleError(err)
    }
}

export function* fetchPreCheckout(action) {
    try {
        let { cart: { preCheckoutData } } = yield select()
        const res  = yield call(cartService.preCheckout, preCheckoutData)
        yield put(cartActions.setPreCheckoutResponse(res.data))
    }catch(err) {
        handleError(err)
    }
}