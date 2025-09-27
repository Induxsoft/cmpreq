var req =
{
    _index:-1,
    table_id:"", table:null, params:{},

    init()
    {
        this.table = document.getElementById(this.table_id);
        this.setTableEvents();
    },

    setTableEvents()
    {
        if (!this.table) return;

        const ik_cproduccion = document.getElementById('ik_cproduccion');

        ik_cproduccion.onBeforeSearch = this.onBeforeSearchCProduccion;
        ik_cproduccion.change_event = this.setCProduccion;

        this.table.AutoAddRow = false;
        this.table.AutoDelRow = false;
        this.table.setInputKey('cproduccion',ik_cproduccion);
        this.table.addEventListener('rowchanged', (e) => { this._index = e.index });
    },

    onBeforeSearchCProduccion(sourceUrl)
    {
        let row = req.table.DataArray[req._index];
        return sourceUrl.replace("@iproducto",row?.iproducto??0);
    },

    setCProduccion(data)
    {
        let row = req.table.DataArray[req._index];
        row['iproduccion'] = data?.sys_pk ?? 0;
        row['cproduccion'] = data?.codigo ?? "";
        row['dproduccion'] = data?.descripcion ?? "";
        req.table.UpdateRow(req._index);
    },

    validateRowsData(data)
    {
        return new Promise(resolve => {
            if (data.length < 1) {
                alert("¡No es posible continuar! Nada para generar.");
                resolve(false);
                return;
            }

            switch (this.params.sobre_aprovisionar) {
                case 0: //Nada (solo lo que necesito)
                {
                    let incomplete_row = data.find(row => {
                        return (
                            ((+row.comprar) + (+row.producir) != row.faltante) ||
                            ([2,5,6].includes(row.iclase) && +row.producir > 0 && !row.cproduccion)
                        )
                    });
                    if (incomplete_row) {
                        alert("¡No es posible continuar! Hay filas incompletas.\r\n - La cantidad por comprar mas producir debe ser igual al faltante.\r\n - Debe seleccionar el C. Producción de los productor a producir.");
                        resolve(false);
                        return;
                    }
                    break;
                }
                case 1: //Hasta el mínimo del producto en el almacen del centro de consumo
                {
                    let incomplete_row = data.find(row => {
                        return (
                            ((+row.comprar) + (+row.producir) < row.faltante) ||
                            ((+row.comprar) + (+row.producir) > (row.faltante + row.uf_minimo)) ||
                            ([2,5,6].includes(row.iclase) && +row.producir > 0 && !row.cproduccion)
                        )
                    });
                    if (incomplete_row) {
                        alert("¡No es posible continuar! Hay filas incompletas.\r\n - La cantidad por comprar mas producir debe ser igual al faltante o hasta el mínimo del producto en el almacén del centro de consumo.\r\n - Debe seleccionar el C. Producción de los productor a producir.");
                        resolve(false);
                        return;
                    }
                    break;
                }
            }

            resolve(true)
        });
    },

    async generate()
    {
        if (this.req_generate) return;
        tools.V12FormBarDisableControls(true);
        this.req_generate = true;

        const data = this.filterData();
        if (!( await this.validateRowsData(data) )) {
            tools.V12FormBarDisableControls(false);
            this.req_generate = false;
            return;
        }

        InduxsoftCrudlModel.InvokeService(".", { detalle:data },
            (resp) => {
                if (resp.message) alert(resp.message);
                this.req_generate = false;
                window.location.href = resp?.url_redir ?? "../";
            },
            (error) => {
                if (error.message) alert(error.message);
                else console.error(error);
                tools.V12FormBarDisableControls(false);
                this.req_generate = false;
            },
            "POST", false
        );
    },

    filterData(){ return (this.table?.DataArray??[]).filter(row => Object.keys(row??{}).length >= this.table.Columns.length) }
}