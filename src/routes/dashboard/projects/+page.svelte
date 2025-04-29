<script lang="ts">
	import { DataArr } from "drizzle-struct/front-end";
    import { Rental } from "$lib/model/rental";
	import { onMount } from "svelte";
    import Grid from "$lib/components/general/Grid.svelte";
	import { Form } from "$lib/utils/form";
	import { goto } from "$app/navigation";
    import nav from "$lib/imports/main";

    nav();

    let projects = $state(new DataArr(Rental.Project, []));
    onMount(() => {
        projects = Rental.Project.all(false);
        projects.sort((a, b) => {
            return new Date(String(a.data.startDate)).getTime() - new Date(String(b.data.startDate)).getTime();
        });

        return projects.subscribe(console.log);
    });
</script>

<div class="container layer-1">
    <div class="row mb-3">
        <div class="col">
            <div class="card layer-2">
                <div class="card-body">
                    <h5 class="card-title">Next Project</h5>
                </div>
            </div>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <Grid 
                layer={2}
                rows={$projects}
                columns={[
                    {
                        field: 'data.name',
                        headerName: 'Project Name',
                    }, 
                    {
                        field: 'data.description',
                        headerName: 'Description',
                    },
                    {
                        field: 'data.status',
                        headerName: 'Status',
                        'cellRenderer': (data: any) => {
                            return data.data?.data.status?.toUpperCase();
                        }
                    },
                    {
                        field: 'data.startDate',
                        headerName: 'Start',
                        'cellRenderer': (data: any) => {
                            return new Date(data.data?.data.startDate).toLocaleString();
                        }
                    },
                    {
                        field: 'data.endDate',
                        headerName: 'End',
                        'cellRenderer': (data: any) => {
                            return new Date(data.data?.data.endDate).toLocaleString();
                        }
                    },
                ]}
                gridOpts={
                    {
                        'rowHeight': 50,
                        'headerHeight': 50,
                        'paginationPageSize': 10,
                        'pagination': true,
                        'onRowDoubleClicked': (data) => {
                            goto(`/dashboard/project/${data.data?.data.id}`);
                        }
                    }
                }
                style="height: 400px; width: 100%;"
                onsearch={(value) => $projects.filter((p) => {
                    return p.data.name?.toLowerCase().includes(value.toLowerCase()) || 
                        p.data.description?.toLowerCase().includes(value.toLowerCase());
                })}
                filter={true}
            />
        </div>
    </div>
    <div class="row mb-3">
        <div class="col">
            <button type="button" class="btn btn-primary w-100" onclick={async () => {
                const res = await new Form()
                    .input('name', {
                        disabled: false,
                        required: true,
                        type: 'text',
                        placeholder: 'My Project...',
                        value: '',
                        label: 'Project Name'
                    })
                    .input('description', {
                        disabled: false,
                        required: true,
                        type: 'text',
                        placeholder: 'Project Description...',
                        value: '',
                        label: 'Project Description'
                    })
                    .input('startDate', {
                        disabled: false,
                        required: true,
                        type: 'datetime-local',
                        placeholder: '',
                        value: '',
                        label: 'Start'
                    })
                    .input('endDate', {
                        disabled: false,
                        required: true,
                        type: 'datetime-local',
                        placeholder: '',
                        value: '',
                        label: 'End'
                    })
                    .input('notes', {
                        disabled: false,
                        required: false,
                        type: 'textarea',
                        placeholder: 'Notes...',
                        value: '',
                        label: 'Notes'
                    })
                    .prompt({ 
                        title: 'New Project',
                        send: false,
                    })
                    .unwrap();

                const planningStartDate = new Date(res.value.startDate);
                planningStartDate.setDate(planningStartDate.getDate() - 1);
                const planningEndDate = new Date(res.value.endDate);
                planningEndDate.setDate(planningEndDate.getDate() + 1);
                
                await Rental.Project.new({
                    ...res.value,
                    startDate: new Date(res.value.startDate).toISOString(),
                    endDate: new Date(res.value.endDate).toISOString(),
                    clientId: '',
                    contactId: '',
                    status: Rental.ProjectStatus.CONCEPT,
                    planningStartDate: planningStartDate.toISOString(),
                    planningEndDate: planningEndDate.toISOString(),
                }).unwrap();
            }}>
                <i class="material-icons">add</i>
                New Project
            </button>
        </div>
    </div>
</div>
