// Import necessary modules and dependencies
import DataQueue from '../../../src/main/technicalServices/DataQ';
import ConfigurationRepository from '../../../src/main/core/configuration/ConfigurationRepository';
import FontsCache from '../../../src/main/collectors/static/font/collection/v2/FontsCache';
import FontsProvider from '../../../src/main/collectors/static/font/collection/FontsProvider';
import fontScannerResolver from '../../../src/main/collectors/static/font/collection/FontScannerResolver';
import CDUtils from '../../../src/main/technicalServices/CDUtils';
import DOMUtils from '../../../src/main/technicalServices/DOMUtils';

// Import assertion library (Assuming using Node's assert module)
// import assert from 'assert';
import FontVersionType from '../../../src/main/collectors/static/font/collection/v2/types/FontVersionType';
import FontCollection from '../../../src/main/collectors/static/font/collection/FontCollection';

// Describe the test suite
describe('FontCollectionFeature UI Thread Performance Tests', function () {
    // Increase timeout for asynchronous operations if necessary
    this.timeout(60000); // 60 seconds to accommodate multiple scans

    let fontCollectionFeatureV1, fontCollectionFeatureV2;
    let dataQueueV1, dataQueueV2;
    let configRepoV1, configRepoV2;
    let fontsCacheV1, fontsCacheV2;
    let fontsProviderV1, fontsProviderV2;

    // Setup before each test
    beforeEach(async () => {
        /**
         * Initialize dependencies for VERSION1
         */
        dataQueueV1 = new DataQueue(DOMUtils);
        configRepoV1 = new ConfigurationRepository();
        fontsCacheV1 = new FontsCache();
        fontsProviderV1 = new FontsProvider();

        const scannerV1 = fontScannerResolver({ utils: CDUtils, domUtils: DOMUtils, configurationRepository: configRepoV1, fontVersion: FontVersionType.VERSION1 });

        fontCollectionFeatureV1 = new FontCollection(
            CDUtils,
            DOMUtils,
            dataQueueV1,
            configRepoV1,
            FontVersionType.VERSION1,
            scannerV1,
            fontsProviderV1,
            fontsCacheV1
        );

        /**
         * Initialize dependencies for VERSION2
         */
        dataQueueV2 = new DataQueue(DOMUtils);
        configRepoV2 = new ConfigurationRepository();
        fontsCacheV2 = new FontsCache();
        fontsProviderV2 = new FontsProvider();

        const scannerV2 = fontScannerResolver({ utils: CDUtils, domUtils: DOMUtils, configurationRepository: configRepoV2, fontVersion: FontVersionType.VERSION2 });

        fontCollectionFeatureV2 = new FontCollection(
            CDUtils,
            DOMUtils,
            dataQueueV2,
            configRepoV2,
            FontVersionType.VERSION2,
            scannerV2,
            fontsProviderV2,
            fontsCacheV2
        );
    });

    /**
     * Utility function to perform font scanning and measure execution time
     * @returns {Object} - Contains executionTime, installedFonts, and scanTime
     */
    const performScan = async (fontCollectionFeature) => {
        const startTime = performance.now();
        const { installedFonts, scanTime } = await fontCollectionFeature._scanForInstalledFonts();
        const endTime = performance.now();
        const executionTime = endTime - startTime;

        return { executionTime, installedFonts, scanTime };
    };



    /**
 * Utility function to perform UI tasks
 * Simulates lightweight UI operations while font scanning runs
 */
    const performUITasks = async (taskCount = 50) => {
        const uiTaskGaps = [];
        let previousUITaskTime = performance.now();

        for (let i = 0; i < taskCount; i++) {
            const currentTime = performance.now();
            const gap = currentTime - previousUITaskTime;
            uiTaskGaps.push(gap);
            previousUITaskTime = currentTime;

            // Simulate lightweight UI work
            for (let j = 0; j < 100000; j++) {
                Math.sqrt(j);
            }
            await new Promise((resolve) => {
                //delay in ms to simulate other tasks running in the UI thread
                return setTimeout(resolve, 10);
            }); // Simulate I/O
        }

        return uiTaskGaps;
    };

    /**
 * Test Case 8:
 * Collect data when VERSION1 is run standalone.
 */
    it('Data Collection: VERSION1 Standalone', async () => {
        const { installedFonts, scanTime } = await performScan(fontCollectionFeatureV1);
        console.log(`Data Collection: VERSION1 Standalone`);
        console.log(`Fonts Found: ${installedFonts.length}, Scan Time: ${scanTime} ms`);
    });

    /**
     * Test Case 9:
     * Collect data when VERSION2 is run standalone.
     */
    it('Data Collection: VERSION2 Standalone', async () => {
        const { installedFonts, scanTime } = await performScan(fontCollectionFeatureV2);
        console.log(`Data Collection: VERSION2 Standalone`);
        console.log(`Fonts Found: ${installedFonts.length}, Scan Time: ${scanTime} ms`);
    });

    /**
     * Test Case 10:
     * Collect data when VERSION1 and VERSION2 are run in parallel.
     */
    it('Data Collection: VERSION1 and VERSION2 Parallel', async () => {
        const scanTasks = [
            performScan(fontCollectionFeatureV1),
            performScan(fontCollectionFeatureV2)
        ];
        const [v1Results, v2Results] = await Promise.all(scanTasks);

        console.log(`Data Collection: VERSION1 and VERSION2 Parallel`);
        console.log(`VERSION1: Fonts Found: ${v1Results.installedFonts.length}, Scan Time: ${v1Results.scanTime} ms`);
        console.log(`VERSION2: Fonts Found: ${v2Results.installedFonts.length}, Scan Time: ${v2Results.scanTime} ms`);
    });

    /**
     * Test Case 11:
     * Measure VERSION1 performance while UI tasks are running.
     */
    it('Data Collection: VERSION1 with UI Running', async () => {
        const uiTasks = performUITasks();
        const scanTask = performScan(fontCollectionFeatureV1);

        const [uiTaskGaps, scanResults] = await Promise.all([uiTasks, scanTask]);

        console.log(`Data Collection: VERSION1 with UI Running`);
        console.log(`Fonts Found: ${scanResults.installedFonts.length}, Scan Time: ${scanResults.scanTime} ms`);
        console.log(`UI Task Gaps:`, uiTaskGaps);
        console.log(`Max UI Task Gap: ${Math.max(...uiTaskGaps)} ms`);
    });

    /**
     * Test Case 12:
     * Measure VERSION2 performance while UI tasks are running.
     */
    it('Data Collection: VERSION2 with UI Running', async () => {
        const uiTasks = performUITasks();
        const scanTask = performScan(fontCollectionFeatureV2);

        const [uiTaskGaps, scanResults] = await Promise.all([uiTasks, scanTask]);

        console.log(`Data Collection: VERSION2 with UI Running`);
        console.log(`Fonts Found: ${scanResults.installedFonts.length}, Scan Time: ${scanResults.scanTime} ms`);
        console.log(`UI Task Gaps:`, uiTaskGaps);
        console.log(`Max UI Task Gap: ${Math.max(...uiTaskGaps)} ms`);
    });

    /**
     * Test Case 13:
     * Measure VERSION1 and VERSION2 performance in parallel while UI tasks are running.
     */
    it('Data Collection: VERSION1 and VERSION2 Parallel with UI Running', async () => {
        const uiTasks = performUITasks();
        const scanTasks = [
            performScan(fontCollectionFeatureV1),
            performScan(fontCollectionFeatureV2)
        ];

        const [uiTaskGaps, [v1Results, v2Results]] = await Promise.all([uiTasks, Promise.all(scanTasks)]);

        console.log(`Data Collection: VERSION1 and VERSION2 Parallel with UI Running`);
        console.log(`VERSION1: Fonts Found: ${v1Results.installedFonts.length}, Scan Time: ${v1Results.scanTime} ms`);
        console.log(`VERSION2: Fonts Found: ${v2Results.installedFonts.length}, Scan Time: ${v2Results.scanTime} ms`);
        console.log(`UI Task Gaps:`, uiTaskGaps);
        console.log(`Max UI Task Gap: ${Math.max(...uiTaskGaps)} ms`);
    });


});
