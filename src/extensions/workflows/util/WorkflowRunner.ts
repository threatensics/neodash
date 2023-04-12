import { QueryStatus, runCypherQuery } from '../../../report/ReportQueryRunner';
import { STEP_STATUS } from '../NeoWorkflowRunnerModal';

async function sleep(msec) {
  return new Promise((resolve) => setTimeout(resolve, msec));
}

async function consoleLogAsync(message: string, other?: any) {
  await new Promise((resolve) => setTimeout(resolve, 0)).then(() => console.info(message, other));
}
// TODO: detach runCypherQuery method from here and define another method for the workflows

async function runWorkflowStep(driver, database, query, setStatus, setRecords) {
  await runCypherQuery(
    driver,
    database,
    query,
    {},
    1000,
    setStatus,
    setRecords,
    (fields) => {
      // eslint-disable-next-line no-console
      console.log(`Query runner attempted to set fields: ${JSON.stringify(fields)}`);
    },
    [],
    false,
    false,
    false,
    1000
  );
}
/**
 * Runs a workflow and sets the state of each step at their ending
 * @param driver Neo4j Driver to call the database
 * @param database Database that will be impacted by the workflow
 * @param workflow Workflow to run, composed by a list of steps
 * @param workflowIndex Index that identifies a worlflow in the list of workflows
 * @param workflowStatus Status of each step of the workflow
 * @param setWorkflowStatus Callback to set the status of the workflow inside the component calling the function
 * @param setResults Callback to set the results and show them to the UI
 * @param setIsRunning Callback to set if the workflow is running
 * @param updateWorkflowStepStatus Callback to set the status of the single step in the workflow
 */
export function runWorkflow(
  driver,
  database,
  workflow,
  workflowIndex,
  workflowStatus,
  setWorkflowStatus,
  setResults,
  setIsRunning,
  setCurrentWorkflowStatus,
  updateWorkflowStepStatus
) {
  let stop = false;
  let errorMessage = '';

  function setErrorMessage(msg) {
    errorMessage = msg;
  }
  function abort(msg) {
    setErrorMessage(msg);
    stop = true;
  }

  /**
   * Function to set the workflow status when it ends.
   * A workflow can be:
   * - Completed
   * - Failed
   * - Aborted
   */
  function setWorkflowFinalStatus() {
    // Green only if it's really completed
    if (
      workflowStatus.findIndex((value) => value != STEP_STATUS.COMPLETE) < 0 &&
      workflowStatus.length === workflow.steps.length
    ) {
      setCurrentWorkflowStatus(STEP_STATUS.COMPLETE);
    } else if (workflowStatus.includes(STEP_STATUS.ERROR)) {
        setCurrentWorkflowStatus(STEP_STATUS.ERROR);
      } else {
        setCurrentWorkflowStatus(STEP_STATUS.CANCELLED);
      }
  }
  /**
   * Function to manage the ending of a workflow
   */
  function handleEnd() {
    setIsRunning(false);
    setWorkflowFinalStatus();
  }

  async function run() {
    const results: any[] = [];

    const setWorkflowStatusForStep = (stepIndex, status) => {
      workflowStatus[stepIndex] = status;
      setWorkflowStatus([...workflowStatus]);
      updateWorkflowStepStatus(workflowIndex, stepIndex, status);
    };

    try {
      for (let index = 0; index < workflow.steps.length; index++) {
        /**
         * Function passed to the query runner to set the records got from the UI
         * @param records Records got from the query runner
         */
        const setRecords = (records) => {
          results[index].records = records;
          if (records.length === 1 && records[0].error) {
            setErrorMessage(records[0].error);
          }
        };
        /**
         * Function passed to the query runner to set the status got from the UI
         * @param records Records got from the query runner
         */
        const setStatus = (status) => {
          let possiblePositiveStatus = [QueryStatus.NO_DATA, QueryStatus.COMPLETE, QueryStatus.COMPLETE_TRUNCATED];
          let newStatus = STEP_STATUS.COMPLETE;
          // if the query is not completed, throw an error and abort to prevent running the next steps
          if (!possiblePositiveStatus.includes(status)) {
            newStatus = STEP_STATUS.ERROR;
            abort('Something wrong happened during the run of the workflow');
          }
          results[index].status = newStatus;
          setWorkflowStatusForStep(index, newStatus);
        };

        if (stop) {
          throw new Error(errorMessage);
        }

        setWorkflowStatusForStep(index, STEP_STATUS.RUNNING);
        results.push({ records: [], status: STEP_STATUS.RUNNING });

        let { query } = workflow.steps[index];
        await runWorkflowStep(driver, database, query, setStatus, setRecords);

        // Refreshing the result state
        setResults(results);

        // Added sleep to prevent strange refresh on main screen
        await sleep(10);
      }
    } catch (e) {
      await consoleLogAsync('Error while running a workflow:', e);
    } finally {
      handleEnd();
      await consoleLogAsync('Worklow results TO REMOVE:', results);
    }
  }
  return {
    promise: run(),
    abort: abort,
  };
}
