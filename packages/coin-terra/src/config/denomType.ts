export type DenomInfo = {
    name: string,
    unit: string,
    protoUnit: string,
    signature: string,
}

// signature = [name(8B)] [protoUnit(8B)] [certificate(72B)]
export const DENOMTYPE = {
    LUNA : {
        name: "LUNA",
        unit: "uluna",
        protoUnit: "0a05756c756e61",
        signature: "000000004c554e41000a05756c756e613046022100C8A5265D856B7944A7012B440A6CA889F7658BD8A0B3C9806E1D8496703589D8022100B1A27442055451115CA453E880C1756B9C492FB939F8B1547FEB8F7FE5A887BE",
    },
    UST : {
        name: "UST",
        unit: "uusd",
        protoUnit: "0a0475757364",
        signature: "000000000055535400000a04757573643045022015E21C20DB964F5F10FC32FE8F9861B58459C1E8D67D6F4903BA9BD60ED7A7EA022100BBCDCEE03C5191CCC05295AE50AA241AB42C3A8693AE9B148CB944FB71DDFEC4",
    },
    KRT : {
        name: "KRT",
        unit: "ukrw",
        protoUnit: "0a04756b7277",
        signature: "00000000004b525400000a04756b72773045022100E37E66FE2EF2289A82D4FD0858D982A3E673020A6BF88BDA1CD95DD4365B663002205E26D8BF77C83311781F1AC5F9744EE4E77E4D98AC56A3B09D8FB343D563C2DB",
    },
};

// unit list
// uluna, usdr, ukrw, uusd, umnt, ueur, ucny, ujpy, ugbp, uinr, ucad, uchf, uhkd, uaud, usgd, uthb, usek, unok, udkk, uidr, uphp