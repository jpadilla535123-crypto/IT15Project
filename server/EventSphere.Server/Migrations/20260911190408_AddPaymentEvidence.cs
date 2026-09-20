using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventSphere.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentEvidence : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "EvidencePath",
                table: "Payments",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EvidencePath",
                table: "Payments");
        }
    }
}
