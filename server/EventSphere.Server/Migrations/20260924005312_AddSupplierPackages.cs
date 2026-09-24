using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventSphere.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddSupplierPackages : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PackageInclusions",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PackageName",
                table: "Suppliers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PackagePrice",
                table: "Suppliers",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PackageInclusions",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "PackageName",
                table: "Suppliers");

            migrationBuilder.DropColumn(
                name: "PackagePrice",
                table: "Suppliers");
        }
    }
}
