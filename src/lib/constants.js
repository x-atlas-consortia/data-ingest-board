import ENVS from './helpers/envs'
export const STATUS = {
    datasets: [
        { text: 'Unpublished', value: 'unpublished' },
        { text: 'Published', value: 'published' },
        { text: 'QA', value: 'qa' },
        { text: 'Approval', value: 'approval' },
        ...ENVS.datasetStatus()
    ],

    uploads: [
        { text: 'Valid', value: 'valid' },
        { text: 'Reorganized', value: 'reorganized' }
    ]
}

export const modalDefault = { cancelCSS: 'none', okText: 'OK' }
