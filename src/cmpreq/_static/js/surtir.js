var req =
{
    table_id:"", table:null, params:{},

    init()
    {
        this.table = document.getElementById(this.table_id);
        this.setTableEvents();
    },

    setTableEvents()
    {
        if (!this.table) return;

        this.table.AutoAddRow = false;
        this.table.AutoDelRow = false;
    },

    validateRowsData(data)
    {
        return new Promise(resolve => {
            if (data.length < 1) {
                alert("¡No es posible continuar! Nada por procesar.");
                resolve(false);
                return;
            }
            
            let invalid_row = data.find(row => {
                return (
                    (+row.entregar > row.faltante) ||
                    (+row.entregar > row.exist_origen)
                )
            });
            if (invalid_row) {
                alert("¡No es posible continuar! Hay filas inválidas.\r\n - La cantidad a entregar debe ser menor o igual al faltante.\r\n - La cantidad a entregar debe ser menor o igual a la existencia del origen.");
                resolve(false);
                return;
            }
            
            resolve(true);
        });
    },
    
    async process()
    {
        if (this.req_process) return;
        tools.V12FormBarDisableControls(true);
        this.req_process = true;

        const data = this.filterData();
        if (!( await this.validateRowsData(data) )) {
            tools.V12FormBarDisableControls(false);
            this.req_generate = false;
            return;
        }

        InduxsoftCrudlModel.InvokeService(".", { detalle:data },
            (resp) => {
                if (resp.message) alert(resp.message);
                this.req_process = false;
                window.location.href = resp?.url_redir ?? "../";
            },
            (error) => {
                if (error.message) alert(error.message);
                else console.error(error);
                tools.V12FormBarDisableControls(false);
                this.req_process = false;
            },
            "POST", false
        );
    },

    filterData(){ return (this.table?.DataArray??[]).filter(row => Object.keys(row??{}).length >= this.table.Columns.length) }
}