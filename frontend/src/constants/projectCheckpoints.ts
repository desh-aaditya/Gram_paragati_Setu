
export interface DefaultCheckpoint {
    name: string;
    description: string;
    is_mandatory: boolean;
    completion_percentage: number; // 0-100 represents relative timing within project duration
}

export const DEFAULT_CHECKPOINTS: Record<string, DefaultCheckpoint[]> = {
    'infrastructure': [
        {
            name: 'Site Survey & Feasibility Study',
            description: 'Conduct initial survey of the site and assess feasibility.',
            is_mandatory: true,
            completion_percentage: 10
        },
        {
            name: 'Material Procurement',
            description: 'Purchase and delivery of necessary construction materials.',
            is_mandatory: true,
            completion_percentage: 20
        },
        {
            name: 'Foundation Work',
            description: 'Excavation and laying of foundation.',
            is_mandatory: true,
            completion_percentage: 40
        },
        {
            name: 'Structure Construction',
            description: 'Building the main structure (walls, pillars, etc.).',
            is_mandatory: true,
            completion_percentage: 70
        },
        {
            name: 'Finishing & Inspection',
            description: 'Painting, electrical, plumbing, and final inspection.',
            is_mandatory: true,
            completion_percentage: 95
        }
    ],
    'education': [
        {
            name: 'Land Identification & Clearance',
            description: 'Identify suitable land for school building and clear the site.',
            is_mandatory: true,
            completion_percentage: 10
        },
        {
            name: 'Foundation Laying',
            description: 'Excavation and laying of school building foundation.',
            is_mandatory: true,
            completion_percentage: 30
        },
        {
            name: 'Classroom Construction',
            description: 'Construction of walls, roof, and classrooms.',
            is_mandatory: true,
            completion_percentage: 60
        },
        {
            name: 'Sanitation Facilities',
            description: 'Construction of toilets and water facilities.',
            is_mandatory: true,
            completion_percentage: 80
        },
        {
            name: 'Final Finishing',
            description: 'Painting, flooring, and electrical work.',
            is_mandatory: true,
            completion_percentage: 95
        }
    ],
    'healthcare': [
        {
            name: 'Site Selection & Planning',
            description: 'Select site for health center and finalize architectural plan.',
            is_mandatory: true,
            completion_percentage: 10
        },
        {
            name: 'Foundation Work',
            description: 'Laying the foundation for the health center.',
            is_mandatory: true,
            completion_percentage: 30
        },
        {
            name: 'Building Structure',
            description: 'Construction of wards, OPD, and other rooms.',
            is_mandatory: true,
            completion_percentage: 60
        },
        {
            name: 'Medical Infrastructure Setup',
            description: 'Installation of specialized medical infrastructure (oxygen lines, etc.).',
            is_mandatory: true,
            completion_percentage: 85
        },
        {
            name: 'Final Inspection & Handover',
            description: 'Final quality check and handover for operations.',
            is_mandatory: true,
            completion_percentage: 100
        }
    ],
    'water supply': [
        {
            name: 'Source Identification',
            description: 'Identify water source (borewell, river, etc.).',
            is_mandatory: true,
            completion_percentage: 10
        },
        {
            name: 'Pipeline Laying / Drilling',
            description: 'Drilling borewell or laying pipelines.',
            is_mandatory: true,
            completion_percentage: 30
        },
        {
            name: 'Tank Construction/Installation',
            description: 'Install water storage tanks.',
            is_mandatory: true,
            completion_percentage: 60
        },
        {
            name: 'Connection & Testing',
            description: 'Connect pipes to households/taps and test flow.',
            is_mandatory: true,
            completion_percentage: 80
        },
        {
            name: 'Water Quality Test',
            description: 'Lab testing of water quality.',
            is_mandatory: true,
            completion_percentage: 90
        }
    ],
    'road': [
        {
            name: 'Land Survey & Clearance',
            description: 'Survey the route and clear vegetation/obstacles.',
            is_mandatory: true,
            completion_percentage: 10
        },
        {
            name: 'Base Layer Preparation',
            description: 'Laying and compacting the base layer (gravel/stones.',
            is_mandatory: true,
            completion_percentage: 30
        },
        {
            name: 'Surface Laying',
            description: 'Laying concrete or bitumen surface.',
            is_mandatory: true,
            completion_percentage: 60
        },
        {
            name: 'Curing / Setting',
            description: 'Allowing the road to set/cure.',
            is_mandatory: true,
            completion_percentage: 80
        },
        {
            name: 'Final Inspection',
            description: 'Quality check and opening to traffic.',
            is_mandatory: true,
            completion_percentage: 95
        }
    ],
    'livelihood': [
        {
            name: 'Site Identification',
            description: 'Identify land for community center or workshop.',
            is_mandatory: true,
            completion_percentage: 10
        },
        {
            name: 'Foundation & Structure',
            description: 'Construction of the facility structure.',
            is_mandatory: true,
            completion_percentage: 40
        },
        {
            name: 'Utility Installation',
            description: 'Electrical and water connection for machinery.',
            is_mandatory: true,
            completion_percentage: 60
        },
        {
            name: 'Equipment Installation',
            description: 'Installation of heavy machinery or tools.',
            is_mandatory: true,
            completion_percentage: 80
        },
        {
            name: 'Safety Inspection',
            description: 'Ensure facility meets safety standards.',
            is_mandatory: true,
            completion_percentage: 95
        }
    ],
    'other': [
        {
            name: 'Project Planning',
            description: 'Define scope and objectives.',
            is_mandatory: true,
            completion_percentage: 10
        },
        {
            name: 'Construction Phase 1',
            description: 'Initial phase of construction.',
            is_mandatory: true,
            completion_percentage: 30
        },
        {
            name: 'Construction Phase 2',
            description: 'Secondary phase of construction.',
            is_mandatory: true,
            completion_percentage: 60
        },
        {
            name: 'Completion & Handover',
            description: 'Finalize project and handover to community.',
            is_mandatory: true,
            completion_percentage: 95
        }
    ]
};
