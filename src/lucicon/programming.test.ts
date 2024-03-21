import { expect, test } from 'vitest'
import * as map from './programming'
import * as utils from './utils'

import lorenz from '../circuits/lorenz.routes.json'

test('output2input(input2output(A))=A', () => {
    const U = [
        8, 9, 10, 8, 9,
        0, 10, 5, 8, 1,
        9
    ]
    const U2 = [
        8, 9, 10, 0, 1,
       10, 2,  2, 3, 9,
        8
     ]
    const fixture = U2
    expect(map.output2input(map.input2output(fixture))).toStrictEqual(utils.fill(fixture, null, 32))
})

test('input2output(output2input(B))=B', () => {
    const I = [
        3,  4, 6, 7, 8,
        0, 10, 1, 9, 2,
        5
      ]
    const fixture = I
    expect(map.input2output(map.output2input(fixture))).toStrictEqual(utils.fill(fixture, null, 16))
})

test('output2input double allocation not representable', () => {
    const I2 = [
        8, 9, 10, 0, 1, // note the 10
       10, 2,  2, 3, 9, // note the 10, again.
        8
     ]
    expect(()=>map.output2input(I2)).toThrowError(/not representable/)
})



test('routes2matrix(matrix2routes)=id', () => {
    const fixture = lorenz.RoutesConfig.routes
    //console.log("fixture =", fixture)
    const mat = map.routes2matrix(fixture)
    //console.log("route2matrix =",mat)
    const back = map.matrix2routes(mat)
    expect(back).toStrictEqual(fixture)
})