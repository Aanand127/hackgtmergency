import { useRegisterState } from 'cedar-os';
import { useState } from 'react';

interface GenericNode {
    id: number,
    text: string,
    chat: string,
}


function GenericNode () {
    const [queries, setQueries] = useState([
        { id: 1, text: 'Advil versus Ibuprofen', chat: "Here is some general information on birth control options:\n\n1. **Hormonal Methods**: These include birth control pills, patches, injections, and vaginal rings. They work by regulating hormones to prevent ovulation.\n\n2. **Barrier Methods**: These include condoms, diaphragms, and cervical caps. They physically block sperm from reaching the egg.\n\n3. **Intrauterine Devices (IUDs)**: These are small devices inserted into the uterus. They can be hormonal or non-hormonal (copper) and prevent sperm from fertilizing the egg.\n\n4." },
        { id: 2, text: 'Birth control solutions', chat: "Here is some general information on meds..." },
    ]);

    // Now the agent will know what the state is, how to change it,
    // and have access to calling these setters
    useRegisterState({
        key: 'queries',
        description: 'A set of Nodes related to past queries',
        value: queries,
        setValue: setQueries,
        stateSetters: {
            addQuery: {
                name: 'addQuery',
                description: 'Add a new user query',
                execute: (currentQueries, setValue, args: { text: string }) => {
                    const newQuery = {
                        id: Date.now(),
                        text: args.text,
                        chat: "tbd",
                    };
                    setValue([...currentQueries, newQuery]);
                },
            },
            removeNode: {
                name: 'removeNode',
                description: 'Remove a node',
                execute: (currentQueries, setValue, args: { id: number }) => {
                    setValue(currentQueries.filter((query) => query.id !== args.id));
                },
            },
        },
    });

    return
};

export default GenericNode;