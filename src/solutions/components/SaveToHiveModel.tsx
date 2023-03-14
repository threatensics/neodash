import React, { useContext, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import IconButton from '@material-ui/core/IconButton';
import Badge from '@material-ui/core/Badge';
import SaveIcon from '@material-ui/icons/Save';
import CloseIcon from '@material-ui/icons/Close';
import {
  Checkbox,
  Input,
  FormControl,
  FormControlLabel,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Select,
  MenuItem,
} from '@material-ui/core';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import { getDashboardJson } from '../../modal/ModalSelectors';
import { applicationGetConnection } from '../../application/ApplicationSelectors';
import { Neo4jContext, Neo4jContextState } from 'use-neo4j/dist/neo4j.context';
import { saveDashboardToHiveThunk, listUserDashboards } from '../persistence/SolutionsThunksRefactor';
import { ExpandMore } from '@material-ui/icons';
import { DatabaseUploadType } from '../config/SolutionsConstants';

/**
 * A modal to save the dashboard and database to Hive
 */

const styles = {};

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper,
    display: 'flex',
    height: 224,
  },
  tabs: {
    borderRight: `1px solid ${theme.palette.divider}`,
  },
}));

export const SaveToHiveModel = ({
  dashboard,
  connection,
  saveDashboardToHive,
  modalOpen,
  closeDialog,
  updateSaveToHiveProgress,
}) => {
  // pieces of code pulled from https://www.pluralsight.com/guides/uploading-files-with-reactjs
  // and pieces of code pulled from https://blog.logrocket.com/multer-nodejs-express-upload-file/
  const [selectedFile, setSelectedFile] = useState();
  const [isSelected, setIsSelected] = useState(false);
  const [overwriteExistingDashboard, setOverwriteExistingDashboard] = React.useState(false);
  const [tabIndex, setTabIndex] = useState(0);

  const { driver } = useContext<Neo4jContextState>(Neo4jContext);

  const classes = useStyles();

  const changeHandler = (event) => {
    setSelectedFile(event.target.files[0]);
    setIsSelected(true);
  };

  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  const [dbType, setDbType] = useState(DatabaseUploadType.DatabaseUpload);
  const [expandedPanel, setExpandedPanel] = useState(false);
  const handleAccordionChange = (panel) => (event, isExpanded) => {
    console.log({ event, isExpanded });
    if (isExpanded) {
      setDbType(panel);
    }
    setExpandedPanel(isExpanded ? panel : false);
  };

  // const [userSavedDashboards, setuserSavedDashboards] = React.useState([]);
  // if(modalOpen === true && userSavedDashboards.length == 0) {
  //   listUserDashboards().then(jsonResponse => console.log(setuserSavedDashboards(jsonResponse.data.dashboards)));
  // }

  return (
    <Dialog maxWidth={'lg'} open={modalOpen === true} onClose={closeDialog} aria-labelledby='form-dialog-title'>
      <DialogTitle id='form-dialog-title'>
        Publish to Hive
        <IconButton
          onClick={() => {
            closeDialog(false);
          }}
          style={{ padding: '3px', float: 'right' }}
        >
          <Badge badgeContent={''}>
            <CloseIcon />
          </Badge>
        </IconButton>
      </DialogTitle>
      <DialogContent style={{ width: '800px' }}>
        <DialogContentText>
          This will save your current dashboard to Hive. Use the below options for Hive managed or self managed demo DB.
        </DialogContentText>

        {/*
        <Tabs
          orientation="vertical"
          variant="scrollable"
          value={tabIndex}
          onChange={handleTabChange}
          aria-label="Publish to Hive"
          className={classes.tabs}
        >        
          <Tab label="Pick a database" id='publish-to-hive-1' aria-label="Pick a database"/>
          <Tab label="Configure card" id='publish-to-hive-2' aria-label="Configure card"/>
          <Tab label="Publish" id='publish-to-hive-3' aria-label="Publish"/>
        </Tabs>      
        <TabPanel value={value} index={0}>
          Item One
        </TabPanel>
        <TabPanel value={value} index={1}>
          Item Two
        </TabPanel>
        <TabPanel value={value} index={2}>
          Item Three
        </TabPanel>
        */}

        <Accordion
          expanded={expandedPanel === DatabaseUploadType.DatabaseUpload}
          onChange={handleAccordionChange(DatabaseUploadType.DatabaseUpload)}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>Hive managed demo DB</AccordionSummary>
          <AccordionDetails>
            <div style={{ height: '100px' }}>
              {/* <div>
                <TextField
                id="standard-select-currency-native"
                select
                // label="select any existing demo DB, if relevent"
                defaultValue=""
                SelectProps={{
                  native: true,
                }}
                helperText="select any existing demo DB, if relevent"
                variant="standard"
              >
                {userSavedDashboards.length > 0 && userSavedDashboards.map((database) => {
                if(database.dbType == DatabaseUploadType.DatabaseUpload){
                 return <option key={database.dbName} value={database.dbName}>{database.dbName}({database.fileName})</option>
                  // return <MenuItem value={database.dbName}>{database.dbName}</MenuItem>;
                }
                })}

              </TextField>
            </div> */}
              <div>
                <Input type='file' name='databasedumpfile' style={{ marginBottom: '3px' }} onChange={changeHandler} />
                {isSelected && (
                  <DialogContentText>
                    Currently Selected File: {selectedFile.name}
                    <span style={{ marginLeft: '2px' }}>
                      ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB, last modified:{' '}
                      {selectedFile.lastModifiedDate.toLocaleDateString()})
                    </span>
                  </DialogContentText>
                )}
              </div>
            </div>

            {dashboard?.extensions?.solutionsHive?.dbName && (
              <FormControl style={{ marginTop: '20px', marginLeft: '10px' }}>
                <Tooltip title='Overwrite dashboard(s) with the same name.' aria-label=''>
                  <FormControlLabel
                    control={
                      <Checkbox
                        style={{ fontSize: 'small', color: 'grey' }}
                        checked={overwriteExistingDashboard}
                        onChange={() => setOverwriteExistingDashboard(!overwriteExistingDashboard)}
                        name='overwrite'
                      />
                    }
                    label='Overwrite'
                  />
                </Tooltip>
              </FormControl>
            )}
          </AccordionDetails>
        </Accordion>

        <Accordion
          expanded={expandedPanel === DatabaseUploadType.NeoConnection}
          onChange={handleAccordionChange(DatabaseUploadType.NeoConnection)}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>Self managed or cloud hosted demo DB</AccordionSummary>
          <AccordionDetails>
            <TextField
              id='auraConnection'
              label='Connection URL'
              variant='outlined'
              defaultValue='neo4j://localhost:7687'
            />
            <TextField id='auraDbName' label='Database' variant='outlined' defaultValue='neo4j' />
            <TextField id='auraUsername' label='Username' variant='outlined' defaultValue='neo4j' />
            <TextField id='auraPassword' label='Password' variant='outlined' type='password' />
          </AccordionDetails>
        </Accordion>

        <Button
          component='label'
          onClick={() => {
            saveDashboardToHive({
              driver,
              selectedFile,
              dashboard,
              date: new Date().toISOString(),
              user: connection.username,
              overwrite: overwriteExistingDashboard,
              updateSaveToHiveProgress,
              dbType,
              dbConnectionUrl: auraConnection.value,
              dbUsername: auraUsername.value,
              dbPassword: auraPassword.value,
              dbName: auraDbName.value,
            });
            closeDialog({ closeSaveDialog: true });
          }}
          style={{ backgroundColor: 'white', marginTop: '20px', float: 'right' }}
          color='default'
          variant='contained'
          endIcon={<SaveIcon />}
          size='medium'
        >
          Done
        </Button>
        <Button
          component='label'
          onClick={closeDialog}
          style={{ float: 'right', marginTop: '20px', marginRight: '10px', backgroundColor: 'white' }}
          color='default'
          variant='contained'
          size='medium'
        >
          Cancel
        </Button>
      </DialogContent>
      <DialogActions></DialogActions>
    </Dialog>
  );
};

const mapStateToProps = (state) => ({
  dashboard: getDashboardJson(state),
  connection: applicationGetConnection(state),
});

const mapDispatchToProps = (dispatch) => ({
  saveDashboardToHive: ({
    driver,
    selectedFile,
    dashboard,
    date,
    user,
    overwrite,
    updateSaveToHiveProgress,
    dbType,
    dbConnectionUrl,
    dbUsername,
    dbPassword,
    dbName,
  }) => {
    dispatch(
      saveDashboardToHiveThunk({
        driver,
        selectedFile,
        dashboard,
        date,
        user,
        overwrite,
        updateSaveToHiveProgress,
        dbType,
        dbConnectionUrl,
        dbUsername,
        dbPassword,
        dbName,
      })
    );
  },
});

export default withStyles(styles)(connect(mapStateToProps, mapDispatchToProps)(SaveToHiveModel));
