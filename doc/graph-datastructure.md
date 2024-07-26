# Data structures used in the lucigui/lucicon code

This file shall complement a bit the code within this repository (i.e. for the LUCIDAC GUI,
it's visual circuit editor and the typescript/javascript hybrid controller communication library
*lucicon*).

For the communication library and its various representations for circuits, have a look at the
file `src/lucicon/types.ts`. It is almost 500 documented lines of pure data structure definitions
where in contrast all the associated algorithms are written down in `src/lucicon/mappings.ts`.

A lot of names had to be invented which are also denoted in our internal project glossary at
https://outline.anabrid.com/doc/redac-definitionsnames-mmO9VOAPbq. Please have a look at that
list. **TODO: Copy list here for having a consistent code documentation**

## Understanding the lucicon and lucigui structure
Of course, the lucigui code is highly modular (which code isn't?). The circuit editor part is
called `Editor.svelte` and basically works on the lucicon `ClusterConfig` which contains, amongst
others, the `ReducedConfig` for the UCI matrix. I prefer this representation of the UCI matrix
most because in it the U, C and I matrix are each represented by 32 numbers only.

The circuit editor has a number of different `Views` for allowing to view and edit this configuration.
For instance, there is a matrix view visualizing the UCI matrix structure and called `BlockView.svelte`.
The visual circuit editor is called `SvelteFlowView`. This name includes the name of the node-based
user interface toolkit called [SvelteFlow](https://svelteflow.dev/). This diagrammatical user
interface idiom is frequently called *flow*. SvelteFlow is open source and still an alpha software.
In [issue #6](https://lab.analogparadigm.com/lucidac/software/lucidac-gui/-/issues/6) we consider
switching to https://www.jointjs.com/ which is *much* more powerful. Technically this would result
in something like a `JointView` or similar which stands next to `SvelteFlowView` and potentially
replaces it one day. That also means all text below this line has the potential to change when we
decide to make the switch.

## Svelteflow data structures
Svelteflow uses generic/templated data structures which can be extended with custom data. That is,
for instance the node data have type which is mostly `Node<Stateful computing element from lucicon>`
whereas the edges have a type which is pseudocoded `Edge<>`, so no custom data associated. Browsing
the type definitions alone is not very helpful so let's grasp instead the underlying idiom of the
svelteflow data structures.

Each node and edge in svelteflow has a (potentially user-defined) string id attribute. In particular
for the nodes we encode the computing element type and index within its string ide:

```js
single_node = {
    "id": "Mul0",
    "data": { our user-defined data structures },
    other stuff by svelteflow
}
```

Other stuff by svelteflow is something svelteflow will compute if it is missing. Mostly this includes
information about the UI state (is the element selected, draggable, where is it physically located).
The list of nodes is just a list of this kind of objects. As typescript is compiled to javascript,
we are exactly dealing with JSON, the internal representation is exactly the serialization format used
within the LUCIDAC project all over the place.

Here is, for reference, an exemplaric full node with all its attributes:

```js
    {
        "id": "Mul0",
        "position": {
            "x": 163,
            "y": 46.5
        },
        "origin": [
            0.5,
            0
        ],
        "type": "analog",
        "data": {
            "rtl": false
        },
        "computed": {
            "positionAbsolute": {
                "x": 163,
                "y": 46.5
            },
            "width": 60,
            "height": 40
        },
        "selected": false,
        "dragging": false
    }
```

Note that the positions highly depend on the viewport and I currently don't have a clear
understanding what are reasonable viewports to use. One should probably have in mind a typical
square or 16:9 screen aspect ratio and thus units like `x_min=0, x_max=160` and `y_min=0, y_max=90`.
There is a button/method for telling svelteflow to fit the graph to the screen. There is, on the
other side, also a maximum zoom level.

For the "payload data" of a node, this is currently an algebraic data structure which is
`IntState | PotState | NodeDisplay | undefined`, i.e. it is either

* `IntState`, i.e `{ ic: 0.123, k:10000 }`
* `PotState`, i.e `{ coeff: 12.345 }`
* `NodeDisplay`, i.e. `{ rtl: true }` for mirroring inputs and outputs (right-to-left display)
* nothing, just an empty dictionary

A typical edge data structure looks like the following:

```js
single_edge = 
    {
        "source": "Mul0",
        "sourceHandle": "out",
        "target": "Int0",
        "targetHandle": "in",
        "id": "xy-edge__Mul0out-Int0in",
        "type": "smoothstep"
    }
```

Again, this object has (and needs) an id, despite this id is autocomputed and we don't make use of it.
The entries `source` and `target` refer to ids of nodes. The entries `sourceHandle` and `targetHandle`
refer to the named handles which appear within the nodal definition in the svelte files. This information
alone allows us to perfectly reconstruct the major information about a route, given that no
potentiometer is involved in this edge!

## Summing up

Given that the whole purpose of the code is to map between all these different data structures and this
is happing at real-time (i.e. during moving a node or connecting two nodes) to keep all different
views in sync, there is not much point in directly writing the graph structure, *despite* one has
an explicit idea about the positions of the nodes and doesn't want to make use of the *autorouter*.
The "automatic" graph layouting is in fact [dagre](https://github.com/dagrejs/dagre), which is of course
a javascript code.