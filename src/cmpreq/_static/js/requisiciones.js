var requisiciones =
{
    list: {
        tableId:"",
        table:null,

        init()
        {
            this.table = document.getElementById(this.tableId);

            this.setKeyboardShortcuts();
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },

        getCurrentContext()
        {
            const id = (this.table?.DataArray[this.table.CurrentRowIndex()]?.sys_pk ?? "");
            return { item_id:id, context: {} }
        },
    },

    form: {
        init()
        {
            this.setKeyboardShortcuts();
        },

        setKeyboardShortcuts()
        {
            document.addEventListener("keydown", (e) => {
                // console.log("key: "+ e.key + " | " + "code: " + e.code);
                if (e.key === "Escape") {
                    e.preventDefault();
                    window.open("/","_top");
                }
                if (e.key === "F5") {
                    e.preventDefault();
                    window.location.reload();
                }
            });
        },
    }
}