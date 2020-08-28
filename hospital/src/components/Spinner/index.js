import React from 'react';
import HashLoader from 'react-spinners/HashLoader';
import { css } from '@emotion/core';

const override = css`
    top: 50%,
    display: block;
    margin: 0 auto;
    max-height: 0;
`;

export default function Spinner({ active }) {
    return (
        <HashLoader
            css={override}
            sizeUnit={'px'}
            size={100}
            color={'#1276BE'}
            loading={active}
        />
    );
}

