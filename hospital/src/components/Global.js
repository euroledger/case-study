import {
    withStyles,
} from '@material-ui/core/styles';

const GlobalCss = withStyles({
    '@global': {
        '.MuiOutlinedInput-root': {
            borderRadius: 0,
            color: 'black',
            fontWidth: 900
        },
        '.MuiTab-wrapper': {
            color: 'white'
        },
        '.MuiInputBase-input': {
            color: 'gray'
        }
    }


})(() => null);

export default GlobalCss;
