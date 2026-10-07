using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace EventSphere.Server.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationSeatNumber : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SeatNumber",
                table: "Registrations",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SeatNumber",
                table: "Registrations");
        }
    }
}
