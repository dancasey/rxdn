# Reactively Defined Networking (rxdn)

An SDN framework built on [Node.js](https://nodejs.org) and [Reactive Extensions](http://reactivex.io). 

> [!WARNING]
> I made this as part of a research project back in 2015-2017. The tooling and versions used here reflect the era. OpenFlow 1.4 and 1.5 are not covered. Dependencies are outdated.


## Related Projects

This is the top of a stack of three projects: the controller.

1. rxdn, this project, which relies on...
2. [node-openflow](https://github.com/dancasey/node-openflow), an OpenFlow 1.0/1.3 library, which is built on...
3. [openflow-schema](https://github.com/dancasey/openflow-schema), which provides message checking and instantiation

For an academic explanation, see Chapters VI and VII of [my dissertation](https://apps.dtic.mil/sti/trecms/pdf/AD1055983.pdf).

## Usage

See the examples directory for simple instantiations of hub and switch behavior:

- [examples/hub10.ts](examples/hub10.ts) OpenFlow 1.0 hub
- [examples/hub13.ts](examples/hub13.ts) OpenFlow 1.3 hub
- [examples/switch10.ts](examples/switch10.ts) OpenFlow 1.0 switch
- [examples/switch10.ts](examples/switch13.ts) OpenFlow 1.3 switch