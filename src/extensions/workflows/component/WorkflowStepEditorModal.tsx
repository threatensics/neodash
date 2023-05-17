import React, { useEffect } from 'react';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
import { withStyles } from '@material-ui/core/styles';
import { connect } from 'react-redux';
import NeoCodeEditorComponent from '../../../component/editor/CodeEditorComponent';
import SaveIcon from '@material-ui/icons/Save';
import { TextField } from '@material-ui/core';
import PlaylistPlayIcon from '@material-ui/icons/PlaylistPlay';

const styles = {};
export const NeoWorkflowStepEditorModal = ({ index, stepName, query, open, setOpen, updateStep }) => {
  const [name, setName] = React.useState(stepName);
  const [queryText, setQueryText] = React.useState(query);
  const handleClose = () => {
    updateStep(index, name, queryText);
    setOpen(false);
  };

  useEffect(() => {
    setName(stepName);
    setQueryText(query);
  }, [index]);

  return (
    <Dialog maxWidth={'md'} scroll={'paper'} open={open} aria-labelledby='form-dialog-title'>
      <DialogTitle id='form-dialog-title'>
        <table style={{ width: '100%' }}>
          <tbody>
            <tr>
              <td>
                <PlaylistPlayIcon
                  style={{
                    paddingTop: '2px',
                  }}
                />
              </td>
              <td style={{ width: '100%' }}>
                <TextField
                  id='standard-outlined'
                  fullWidth
                  label=''
                  // style={{ marginLeft: '0px', marginTop: '8px' }}
                  placeholder='Step name ...'
                  className={'no-underline large'}
                  maxRows={4}
                  value={name}
                  onChange={(event) => {
                    setName(event.target.value);
                  }}
                />
              </td>

              <td>
                <IconButton onClick={handleClose} style={{ float: 'right' }}>
                  <Badge overlap='rectangular' badgeContent={''}>
                    <SaveIcon id={'extensions-modal-close-button'} />
                  </Badge>
                </IconButton>
              </td>
            </tr>
          </tbody>
        </table>
      </DialogTitle>

      <DialogContent style={{ width: '750px' }}>
        <NeoCodeEditorComponent
          value={queryText}
          editable={true}
          language={'cypher'}
          style={{ width: '100%', height: 'auto', border: '1px solid lightgray' }}
          onChange={(value) => {
            setQueryText(value);
          }}
          placeholder={'Enter Cypher here...\n'}
        />
        <p
          style={{
            color: 'grey',
            fontSize: 12,
            width: '100%',
            paddingLeft: '5px',
            borderBottom: '1px solid lightgrey',
            borderLeft: '1px solid lightgrey',
            borderRight: '1px solid lightgrey',
            marginTop: '0px',
          }}
        >
          {'Write the query here that will be used during this step of the workflow.'}
        </p>
      </DialogContent>
    </Dialog>
  );
};
const mapStateToProps = () => ({});
const mapDispatchToProps = () => ({});
export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(NeoWorkflowStepEditorModal));
